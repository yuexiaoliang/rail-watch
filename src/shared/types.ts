// Seat type constants
export const SEAT_LABELS: Record<string, string> = {
  ze: '二等座',
  zy: '一等座',
  swz: '商务座',
  yw: '硬卧',
  rw: '软卧',
  yz: '硬座',
  wz: '无座',
};

export const SEAT_TYPES: Record<string, string> = {
  '二等座': 'ze',
  '一等座': 'zy',
  '商务座': 'swz',
  '硬卧': 'yw',
  '软卧': 'rw',
  '硬座': 'yz',
  '无座': 'wz',
};

export const SEAT_OPTIONS = Object.entries(SEAT_LABELS).map(([key, label]) => ({ key, label }));

// Cell status types
export type CellStatus = 'none' | 'bought' | 'waiting' | 'skipped';

export const STATUS_LABELS: Record<CellStatus, string> = {
  none: '未购',
  bought: '已购',
  waiting: '候补中',
  skipped: '跳过',
};

// Domain types
export interface TrainConfig {
  id: string;
  trainNo: string;
  fromStation: string;
  toStation: string;
  seatTypes: string[];
  enabled: boolean;
}

export interface AppConfig {
  trains: TrainConfig[];
  daysAhead: number;
  intervalMinutes: number;
  hideHolidays?: boolean;
  hideWeekends?: boolean;
}

export interface SeatInfo {
  available: number | string;
  queryTime: string;
}

export interface TicketGroup {
  trainNo: string;
  date: string;
  fromStation: string;
  toStation: string;
  seats: Record<string, SeatInfo>;
  bought: boolean;
  boughtSeatType?: string;
  departureTime?: string;
  status?: CellStatus;
}

export interface TicketInfo {
  date: string;
  trainNo: string;
  fromStation: string;
  toStation: string;
  seatType: string;
  available: number | string;
  queryTime: string;
  departureTime?: string;
}

export interface BoughtRecord {
  trainNo: string;
  date: string;
  seatType: string;
  boughtAt: string;
  status?: 'bought' | 'waiting' | 'skipped';
}

// API response types
export interface TicketsResponse {
  tickets: TicketGroup[];
  holidays: Record<string, string>;
  config: {
    daysAhead: number;
    intervalMinutes: number;
    hideHolidays?: boolean;
    hideWeekends?: boolean;
  };
}

export interface SchedulerStatus {
  running: boolean;
}

// Calendar types
export interface CalendarDayInfo {
  date: string;
  dayOfWeek: number;
  dayName: string;
  isHoliday: boolean;
  isWeekend: boolean;
  isWorkday: boolean;
  isPublicWorkday: boolean;
  holidayName: string | null;
  specialTag: string | null;
}

export interface HolidayRange {
  name: string;
  startDate: string;
  endDate: string;
  days: number;
}

export interface CalendarResult {
  baseDate: string;
  days: CalendarDayInfo[];
  workdayCount: number;
  holidayRanges: HolidayRange[];
}
