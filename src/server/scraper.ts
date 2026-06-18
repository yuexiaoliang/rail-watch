import { chromium, Browser } from 'playwright';
import type { TicketInfo } from '../shared/types.js';

let browser: Browser | null = null;
let stationMap: Map<string, string> | null = null;
let launching: Promise<Browser> | null = null;

const STATION_URL = 'https://kyfw.12306.cn/otn/resources/js/framework/station_name.js?station_version=1.9280';

function onDisconnected() {
  console.warn('[Scraper] Browser disconnected');
  browser = null;
  stationMap = null;
}

export function isBrowserClosedError(err: unknown): boolean {
  const message = (err as Error).message || '';
  return (
    message.includes('browser has been closed') ||
    message.includes('Target page, context or browser has been closed') ||
    message.includes('Browser has been disconnected') ||
    message.includes('Protocol error')
  );
}

export async function getBrowser(): Promise<Browser> {
  if (browser?.isConnected()) {
    return browser;
  }

  if (launching) {
    return launching;
  }

  launching = (async () => {
    try {
      if (browser) {
        try { browser.off('disconnected', onDisconnected); } catch {}
        try { await browser.close(); } catch {}
      }
      const b = await chromium.launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled'],
      });
      b.on('disconnected', onDisconnected);
      browser = b;
      console.log('[Scraper] Browser launched');
      return b;
    } finally {
      launching = null;
    }
  })();

  return launching;
}

export async function closeBrowser() {
  if (launching) {
    try { await launching; } catch {}
  }
  const b = browser;
  browser = null;
  stationMap = null;
  if (b) {
    try { b.off('disconnected', onDisconnected); } catch {}
    try { await b.close(); } catch (err) {
      console.warn('[Scraper] Error closing browser:', (err as Error).message);
    }
  }
}

async function loadStationMapInternal(): Promise<Map<string, string>> {
  if (stationMap) return stationMap;

  const b = await getBrowser();
  const page = await b.newPage();
  try {
    const response = await page.goto(STATION_URL, { waitUntil: 'networkidle' });
    const jsText = await response!.text();
    const map = new Map<string, string>();

    const matches = jsText.match(/@([^|]+)\|([^|]+)\|([^|@]+)/g);
    if (matches) {
      for (const m of matches) {
        const parts = m.slice(1).split('|');
        if (parts.length >= 3) {
          map.set(parts[1], parts[2]);
        }
      }
    }

    stationMap = map;
    return map;
  } finally {
    try {
      await page.close();
    } catch (closeErr) {
      if (!isBrowserClosedError(closeErr)) {
        console.warn('[Scraper] Error closing station page:', (closeErr as Error).message);
      }
    }
  }
}

export async function loadStationMap(): Promise<Map<string, string>> {
  try {
    return await loadStationMapInternal();
  } catch (err) {
    if (isBrowserClosedError(err)) {
      console.warn('[Scraper] Browser closed while loading station map, retrying once...');
      browser = null;
      stationMap = null;
      return await loadStationMapInternal();
    }
    throw err;
  }
}

interface RawTicket {
  date: string;
  trainNo: string;
  fromStation: string;
  toStation: string;
  seatType: string;
  available: number | string;
  departureTime?: string;
}

// 12306 seat type index mapping based on actual response format
const SEAT_INDEX_MAP: Record<string, number> = {
  swz: 32,  // 商务座
  zy: 31,   // 一等座
  ze: 30,   // 二等座
  gr: 23,   // 高级软卧
  rw: 28,   // 软卧
  yw: 27,   // 硬卧
  yz: 29,   // 硬座
  wz: 26,   // 无座
};

async function queryTicketsInternal(
  trainNo: string,
  fromStation: string,
  toStation: string,
  date: string,
  seatTypes: string[],
): Promise<RawTicket[]> {
  const map = await loadStationMap();
  const fromCode = map.get(fromStation);
  const toCode = map.get(toStation);

  if (!fromCode || !toCode) {
    throw new Error(`Unknown station: ${fromStation} or ${toStation}`);
  }

  // Validate date is not in the past
  const queryDate = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (queryDate < today) {
    throw new Error(`Cannot query past date: ${date}`);
  }

  const b = await getBrowser();
  const page = await b.newPage();

  try {
    // Open 12306 ticket page to establish session
    await page.goto('https://kyfw.12306.cn/otn/leftTicket/init', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Intercept the API response
    let apiResult: unknown = null;
    const responseHandler = async (res: any) => {
      if (res.url().includes('leftTicket/query') && res.status() === 200) {
        try {
          apiResult = await res.json();
        } catch {
          // Not JSON, ignore
        }
      }
    };
    page.on('response', responseHandler);

    // Fill form and submit via page evaluate
    await page.evaluate(
      (args: { fromCode: string; toCode: string; date: string; fromName: string; toName: string }) => {
        const fromHidden = document.querySelector('#fromStation') as HTMLInputElement | null;
        const toHidden = document.querySelector('#toStation') as HTMLInputElement | null;
        const dateInput = document.querySelector('#train_date') as HTMLInputElement | null;
        const fromText = document.querySelector('#fromStationText') as HTMLInputElement | null;
        const toText = document.querySelector('#toStationText') as HTMLInputElement | null;
        const queryBtn = document.querySelector('#query_ticket') as HTMLElement | null;

        if (fromHidden) fromHidden.value = args.fromCode;
        if (toHidden) toHidden.value = args.toCode;
        if (dateInput) dateInput.value = args.date;
        if (fromText) fromText.value = args.fromName;
        if (toText) toText.value = args.toName;
        if (queryBtn) queryBtn.click();
      },
      { fromCode, toCode, date, fromName: fromStation, toName: toStation },
    );

    // Wait for API response (max 15s)
    let waited = 0;
    while (!apiResult && waited < 15000) {
      await page.waitForTimeout(500);
      waited += 500;
    }

    page.off('response', responseHandler);

    if (!apiResult) {
      throw new Error('No API response from 12306');
    }

    const resultObj = apiResult as { data?: { result?: string[] } };
    const data = resultObj.data?.result;
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from 12306');
    }

    const results: RawTicket[] = [];

    for (const item of data) {
      const fields = item.split('|');
      const currentTrainNo = fields[3]; // 车次号

      if (currentTrainNo !== trainNo) continue;

      // 提取出发时间（fields[8] 为出发时间）
      const departureTime = fields[8] || undefined;

      // 12306 返回了所有座位类型的数据，全部解析存储
      // 注意：不依赖 canWebBuy 字段，直接根据 raw 值判断
      // canWebBuy='N' 时网页仍可能显示"候补"（票已售完但可候补）
      for (const [seatType, idx] of Object.entries(SEAT_INDEX_MAP)) {
        const raw = fields[idx];
        let available: number | string = '--';

        if (raw === '有') {
          available = '有';
        } else if (raw === '候补') {
          available = '候补';
        } else if (raw && raw !== '' && raw !== '无') {
          const num = parseInt(raw, 10);
          if (!isNaN(num)) available = num;
        } else if (raw === '无' && seatType !== 'wz') {
          // 固定座位无票可候补；无座(wz)不能候补，保持 '--'
          available = '候补';
        }
        // raw === ''（无此座席）或 raw === '无' 且是 wz → 保持 '--'

        results.push({
          date,
          trainNo: currentTrainNo,
          fromStation,
          toStation,
          seatType,
          available,
          departureTime,
        });
      }

      break;
    }

    return results;
  } finally {
    try {
      await page.close();
    } catch (closeErr) {
      if (!isBrowserClosedError(closeErr)) {
        console.warn('[Scraper] Error closing ticket page:', (closeErr as Error).message);
      }
    }
  }
}

export async function queryTickets(
  trainNo: string,
  fromStation: string,
  toStation: string,
  date: string,
  seatTypes: string[],
): Promise<RawTicket[]> {
  try {
    return await queryTicketsInternal(trainNo, fromStation, toStation, date, seatTypes);
  } catch (err) {
    if (isBrowserClosedError(err)) {
      console.warn('[Scraper] Browser closed during query, resetting and retrying once...');
      browser = null;
      stationMap = null;
      return await queryTicketsInternal(trainNo, fromStation, toStation, date, seatTypes);
    }
    throw err;
  }
}
