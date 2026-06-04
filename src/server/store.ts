import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  SEAT_TYPES,
  SEAT_LABELS,
  type TrainConfig,
  type AppConfig,
  type TicketInfo,
  type BoughtRecord,
  type CellStatus,
} from '../shared/types.js';

export { SEAT_TYPES, SEAT_LABELS };
export type { TrainConfig, AppConfig, TicketInfo, BoughtRecord };

const DATA_DIR = process.env.DATA_DIR || join(process.env.HOME || '/home/yuexiaoliang', '.rail-watch');
const LOGS_DIR = join(DATA_DIR, 'logs');

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

ensureDir(DATA_DIR);
ensureDir(LOGS_DIR);

function readJson<T>(filename: string, defaultValue: T): T {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) return defaultValue;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return defaultValue;
  }
}

function writeJson(filename: string, data: unknown) {
  const path = join(DATA_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

// Config
export function getConfig(): AppConfig {
  return readJson<AppConfig>('config.json', {
    trains: [],
    daysAhead: 15,
    intervalMinutes: 5,
  });
}

export function saveConfig(config: AppConfig) {
  writeJson('config.json', config);
}

// Tickets
export function getTickets(): Record<string, TicketInfo> {
  return readJson<Record<string, TicketInfo>>('tickets.json', {});
}

export function saveTickets(tickets: Record<string, TicketInfo>) {
  writeJson('tickets.json', tickets);
}

export function updateTicket(ticket: TicketInfo) {
  const tickets = getTickets();
  const key = `${ticket.trainNo}_${ticket.date}_${ticket.seatType}`;
  tickets[key] = ticket;
  saveTickets(tickets);
}

// Bought records
export function getBoughtRecords(): Record<string, BoughtRecord> {
  return readJson<Record<string, BoughtRecord>>('bought.json', {});
}

export function saveBoughtRecords(records: Record<string, BoughtRecord>) {
  writeJson('bought.json', records);
}

export function addBoughtRecord(record: BoughtRecord) {
  const records = getBoughtRecords();
  const key = `${record.trainNo}_${record.date}`;
  records[key] = record;
  saveBoughtRecords(records);
}

export function removeBoughtRecord(trainNo: string, date: string) {
  const records = getBoughtRecords();
  const key = `${trainNo}_${date}`;
  delete records[key];
  saveBoughtRecords(records);
}

export function isBought(trainNo: string, date: string): boolean {
  const records = getBoughtRecords();
  const key = `${trainNo}_${date}`;
  return key in records;
}

// Cell status: get/set/check
export function getCellStatus(trainNo: string, date: string): CellStatus {
  const records = getBoughtRecords();
  const key = `${trainNo}_${date}`;
  const record = records[key];
  if (!record) return 'none';
  return record.status || 'bought';
}

export function setCellStatus(
  trainNo: string,
  date: string,
  status: CellStatus,
  seatType?: string,
) {
  const records = getBoughtRecords();
  const key = `${trainNo}_${date}`;
  if (status === 'none') {
    delete records[key];
  } else {
    records[key] = {
      trainNo,
      date,
      seatType: seatType || '',
      boughtAt: new Date().toISOString(),
      status,
    };
  }
  saveBoughtRecords(records);
}

export function shouldSkipScrape(trainNo: string, date: string): boolean {
  const status = getCellStatus(trainNo, date);
  return status === 'bought' || status === 'skipped';
}
