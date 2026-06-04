import { Hono } from 'hono';
import { holiday } from '@kang8/chinese-holidays';
import {
  getConfig,
  saveConfig,
  getTickets,
  getBoughtRecords,
  addBoughtRecord,
  removeBoughtRecord,
  getCellStatus,
  setCellStatus,
} from './store.js';
import { SEAT_LABELS, type TrainConfig } from '../shared/types.js';
import { startScheduler, stopScheduler, isRunning } from './scheduler.js';
import { generateCalendar } from './holiday-utils.js';

const api = new Hono();

// Get config
api.get('/config', (c) => {
  return c.json(getConfig());
});

// Update config
api.post('/config', async (c) => {
  const body = await c.req.json();
  const current = getConfig();
  const updated: typeof current = {
    ...current,
    ...body,
    trains: body.trains ?? current.trains,
  };
  saveConfig(updated);
  return c.json(updated);
});

// Add a train
api.post('/trains', async (c) => {
  const body = await c.req.json();
  const config = getConfig();
  const newTrain: TrainConfig = {
    id: crypto.randomUUID(),
    trainNo: body.trainNo,
    fromStation: body.fromStation,
    toStation: body.toStation,
    seatTypes: body.seatTypes || ['ze'],
    enabled: body.enabled !== false,
  };
  config.trains.push(newTrain);
  saveConfig(config);
  return c.json(newTrain);
});

// Delete a train
api.delete('/trains/:id', (c) => {
  const id = c.req.param('id');
  const config = getConfig();
  config.trains = config.trains.filter((t) => t.id !== id);
  saveConfig(config);
  return c.json({ success: true });
});

// Get tickets (grouped by train+date)
api.get('/tickets', (c) => {
  const tickets = getTickets();
  const config = getConfig();
  const bought = getBoughtRecords();

  // Group by trainNo + date
  const grouped: Record<string, {
    trainNo: string;
    date: string;
    fromStation: string;
    toStation: string;
    seats: Record<string, { available: number | string; queryTime: string }>;
    bought: boolean;
    boughtSeatType?: string;
    departureTime?: string;
    status?: import('../shared/types.js').CellStatus;
  }> = {};

  // Build a map from trainNo to station info for bought records without tickets
  const trainMap = new Map<string, { fromStation: string; toStation: string }>();
  for (const t of config.trains) {
    trainMap.set(t.trainNo, { fromStation: t.fromStation, toStation: t.toStation });
  }

  for (const [key, ticket] of Object.entries(tickets)) {
    const groupKey = `${ticket.trainNo}_${ticket.date}`;
    if (!grouped[groupKey]) {
      const boughtRecord = bought[groupKey];
      const status = getCellStatus(ticket.trainNo, ticket.date);
      grouped[groupKey] = {
        trainNo: ticket.trainNo,
        date: ticket.date,
        fromStation: ticket.fromStation,
        toStation: ticket.toStation,
        seats: {},
        bought: !!boughtRecord,
        boughtSeatType: boughtRecord?.seatType,
        departureTime: ticket.departureTime,
        status,
      };
    }
    grouped[groupKey].seats[ticket.seatType] = {
      available: ticket.available,
      queryTime: ticket.queryTime,
    };
    // 保存 departureTime（如果之前没有）
    if (ticket.departureTime && !grouped[groupKey].departureTime) {
      grouped[groupKey].departureTime = ticket.departureTime;
    }
  }

  // Include bought records that have no ticket data yet
  for (const [key, record] of Object.entries(bought)) {
    if (!grouped[key]) {
      const stations = trainMap.get(record.trainNo);
      const status = getCellStatus(record.trainNo, record.date);
      grouped[key] = {
        trainNo: record.trainNo,
        date: record.date,
        fromStation: stations?.fromStation || '',
        toStation: stations?.toStation || '',
        seats: {},
        bought: true,
        boughtSeatType: record.seatType,
        status,
      };
    }
  }

  // Collect holidays within daysAhead range
  const holidays: Record<string, string> = {};
  const today = new Date();
  for (let i = 0; i < (config.daysAhead || 15); i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const name = holiday.publicHolidayName(d);
    if (name) {
      holidays[dateStr] = name;
    }
  }

  return c.json({
    tickets: Object.values(grouped),
    holidays,
    config: {
      daysAhead: config.daysAhead,
      intervalMinutes: config.intervalMinutes,
      hideHolidays: config.hideHolidays,
      hideWeekends: config.hideWeekends,
    },
  });
});

// Set cell status (bought/waiting/skipped/none)
api.post('/bought', async (c) => {
  const body = await c.req.json();
  const { trainNo, date, status = 'bought', seatType } = body;

  if (!trainNo || !date) {
    return c.json({ error: 'trainNo and date required' }, 400);
  }

  if (status === 'none') {
    removeBoughtRecord(trainNo, date);
  } else {
    setCellStatus(trainNo, date, status, seatType);
  }

  return c.json({ success: true });
});

// Unmark as bought (set to none)
api.delete('/bought/:trainNo/:date', (c) => {
  const trainNo = c.req.param('trainNo');
  const date = c.req.param('date');
  removeBoughtRecord(trainNo, date);
  return c.json({ success: true });
});

// Scheduler control
api.get('/scheduler', (c) => {
  return c.json({ running: isRunning() });
});

api.post('/scheduler/start', (c) => {
  startScheduler().catch(console.error);
  return c.json({ running: true });
});

api.post('/scheduler/stop', (c) => {
  stopScheduler();
  return c.json({ running: false });
});

// Calendar / holiday info
api.get('/calendar', (c) => {
  const baseDate = c.req.query('date');
  const days = parseInt(c.req.query('days') || '30', 10);
  const result = generateCalendar(baseDate, days);
  return c.json(result);
});

// Seat labels reference
api.get('/seat-labels', (c) => {
  return c.json(SEAT_LABELS);
});

// Help documentation for AI Agent
api.get('/help', (c) => {
  return c.json({
    description: 'Rail Watch — 12306 余票监控工具 API。用于查询/配置车次、查看余票、标记已购状态。',
    baseUrl: '/api',
    dataDir: '~/.rail-watch/',
    endpoints: [
      {
        path: '/config',
        method: 'GET',
        description: '获取当前配置（车次列表、监控天数、轮询间隔等）',
        response: {
          trains: 'TrainConfig[]',
          daysAhead: 'number (默认15)',
          intervalMinutes: 'number (默认5)',
          hideHolidays: 'boolean?',
          hideWeekends: 'boolean?',
        },
      },
      {
        path: '/config',
        method: 'POST',
        description: '更新配置字段（支持部分更新，trains 不会被覆盖）',
        body: '{ daysAhead?, intervalMinutes?, hideHolidays?, hideWeekends? }',
        example: { body: { daysAhead: 20, hideHolidays: true } },
      },
      {
        path: '/trains',
        method: 'POST',
        description: '添加监听车次',
        body: {
          trainNo: 'string (如 D6722)',
          fromStation: 'string (如 张家口)',
          toStation: 'string (如 清河)',
          seatTypes: "string[] (可选, 默认 ['ze']) — ze=二等座, zy=一等座, swz=商务座, yw=硬卧, rw=软卧, yz=硬座, wz=无座",
        },
      },
      {
        path: '/trains/:id',
        method: 'DELETE',
        description: '删除指定车次',
      },
      {
        path: '/tickets',
        method: 'GET',
        description: '获取所有余票数据（按 trainNo+date 分组），包含节假日信息',
        response: {
          tickets: [
            {
              trainNo: 'string',
              date: 'string (YYYY-MM-DD)',
              fromStation: 'string',
              toStation: 'string',
              seats: "Record<seatType, { available: number|'有'|'--', queryTime: string }>",
              bought: 'boolean',
              boughtSeatType: 'string?',
            },
          ],
          holidays: "Record<date, holidayName> — 如 { '2026-06-19': '端午节' }",
          config: '{ daysAhead, intervalMinutes, hideHolidays?, hideWeekends? }',
        },
        note: 'available 值为 "有" 表示有票(数量不详)，数字表示具体余票数，"--" 表示无数据',
      },
      {
        path: '/bought',
        method: 'POST',
        description: '标记某车次某日期为已购',
        body: {
          trainNo: 'string',
          date: 'string (YYYY-MM-DD)',
          seatType: "string (可选, 如 'ze')",
        },
        note: '标记已购后 scheduler 会自动跳过该车次+日期的抓取',
      },
      {
        path: '/bought/:trainNo/:date',
        method: 'DELETE',
        description: '取消已购标记',
        note: '取消后下一轮 scheduler 会重新抓取',
      },
      {
        path: '/scheduler',
        method: 'GET',
        description: '查询调度器运行状态',
        response: '{ running: boolean }',
      },
      {
        path: '/scheduler/start',
        method: 'POST',
        description: '启动调度器（自动循环抓取余票）',
      },
      {
        path: '/scheduler/stop',
        method: 'POST',
        description: '停止调度器',
      },
      {
        path: '/seat-labels',
        method: 'GET',
        description: '座位类型标签映射',
        response: '{ ze: "二等座", zy: "一等座", swz: "商务座", yw: "硬卧", rw: "软卧", yz: "硬座", wz: "无座" }',
      },
      {
        path: '/help',
        method: 'GET',
        description: '返回本帮助文档',
      },
    ],
    seatTypes: {
      ze: '二等座',
      zy: '一等座',
      swz: '商务座',
      yw: '硬卧',
      rw: '软卧',
      yz: '硬座',
      wz: '无座',
    },
    tips: [
      '查询余票用 GET /tickets，返回的 holidays 字段可用于识别法定节假日',
      '标记已购用 POST /bought，取消用 DELETE /bought/:trainNo/:date',
      'scheduler 每 5 分钟一轮，任务分散执行，最小间隔 3 秒',
      '已购但无 ticket 数据的组合也会出现在 /tickets 返回中（bought=true, seats={}）',
      '所有数据持久化在 ~/.rail-watch/ 下的 JSON 文件中',
    ],
  });
});

export default api;
