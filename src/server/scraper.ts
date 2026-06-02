import { chromium, Browser } from 'playwright';
import type { TicketInfo } from '../shared/types.js';

let browser: Browser | null = null;
let stationMap: Map<string, string> | null = null;

const STATION_URL = 'https://kyfw.12306.cn/otn/resources/js/framework/station_name.js?station_version=1.9280';

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    });
  }
  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    stationMap = null;
  }
}

async function loadStationMap(): Promise<Map<string, string>> {
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
    await page.close();
  }
}

interface RawTicket {
  date: string;
  trainNo: string;
  fromStation: string;
  toStation: string;
  seatType: string;
  available: number | string;
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

export async function queryTickets(
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

      for (const seatType of seatTypes) {
        const idx = SEAT_INDEX_MAP[seatType];
        if (idx === undefined) continue;

        const raw = fields[idx];
        let available: number | string = '--';

        if (raw && raw !== '' && raw !== '无') {
          if (raw === '有') {
            available = '有';
          } else {
            const num = parseInt(raw, 10);
            if (!isNaN(num)) available = num;
          }
        }

        results.push({
          date,
          trainNo: currentTrainNo,
          fromStation,
          toStation,
          seatType,
          available,
        });
      }

      break;
    }

    return results;
  } finally {
    await page.close();
  }
}
