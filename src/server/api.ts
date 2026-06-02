import { Hono } from 'hono';
import { holiday } from '@kang8/chinese-holidays';
import {
  getConfig,
  saveConfig,
  getTickets,
  getBoughtRecords,
  addBoughtRecord,
  removeBoughtRecord,
  SEAT_LABELS,
  type TrainConfig,
} from './store.js';
import { startScheduler, stopScheduler, isRunning } from './scheduler.js';

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
    trains: body.trains || current.trains,
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
      grouped[groupKey] = {
        trainNo: ticket.trainNo,
        date: ticket.date,
        fromStation: ticket.fromStation,
        toStation: ticket.toStation,
        seats: {},
        bought: !!boughtRecord,
        boughtSeatType: boughtRecord?.seatType,
      };
    }
    grouped[groupKey].seats[ticket.seatType] = {
      available: ticket.available,
      queryTime: ticket.queryTime,
    };
  }

  // Include bought records that have no ticket data yet
  for (const [key, record] of Object.entries(bought)) {
    if (!grouped[key]) {
      const stations = trainMap.get(record.trainNo);
      grouped[key] = {
        trainNo: record.trainNo,
        date: record.date,
        fromStation: stations?.fromStation || '',
        toStation: stations?.toStation || '',
        seats: {},
        bought: true,
        boughtSeatType: record.seatType,
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

// Mark as bought
api.post('/bought', async (c) => {
  const body = await c.req.json();
  const { trainNo, date, seatType } = body;

  if (!trainNo || !date) {
    return c.json({ error: 'trainNo and date required' }, 400);
  }

  addBoughtRecord({
    trainNo,
    date,
    seatType: seatType || '',
    boughtAt: new Date().toISOString(),
  });

  return c.json({ success: true });
});

// Unmark as bought
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

// Seat labels reference
api.get('/seat-labels', (c) => {
  return c.json(SEAT_LABELS);
});

export default api;
