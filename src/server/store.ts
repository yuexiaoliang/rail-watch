import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

// Seat type mapping
export const SEAT_TYPES: Record<string, string> = {
  '二等座': 'ze',
  '一等座': 'zy',
  '商务座': 'swz',
  '硬卧': 'yw',
  '软卧': 'rw',
  '硬座': 'yz',
  '无座': 'wz',
};

export const SEAT_LABELS: Record<string, string> = {
  ze: '二等座',
  zy: '一等座',
  swz: '商务座',
  yw: '硬卧',
  rw: '软卧',
  yz: '硬座',
  wz: '无座',
};

// Types
export interface TrainConfig {
  id: string;
  trainNo: string;
  fromStation: string;
  toStation: string;
  seatTypes: string[]; // keys like 'ze', 'zy', 'yw'
  enabled: boolean;
}

export interface AppConfig {
  trains: TrainConfig[];
  daysAhead: number;
  intervalMinutes: number;
  hideHolidays?: boolean;
  hideWeekends?: boolean;
}

export interface TicketInfo {
  date: string;
  trainNo: string;
  fromStation: string;
  toStation: string;
  seatType: string;
  available: number | string;
  queryTime: string;
}

export interface BoughtRecord {
  trainNo: string;
  date: string;
  seatType: string;
  boughtAt: string;
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
