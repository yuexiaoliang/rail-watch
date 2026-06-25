export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const weekday = WEEKDAYS[d.getDay()];
  return `${month}-${day} ${weekday}`;
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function generateDates(daysAhead: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(formatDateYMD(d));
  }
  return dates;
}

import { STATUS_LABELS as _STATUS_LABELS } from './types.js';
export { _STATUS_LABELS as STATUS_LABELS };

export function seatDisplay(available: number | string | undefined): { text: string; color: string } {
  if (available === undefined) return { text: '--', color: 'text-gray-300' };
  if (available === '候补') return { text: '候补', color: 'text-orange-500' };
  if (available === '有') return { text: '有', color: 'text-green-600 font-medium' };
  if (typeof available === 'number') {
    if (available > 0) return { text: String(available), color: 'text-green-600 font-medium' };
    return { text: '0', color: 'text-gray-400' };
  }
  return { text: '--', color: 'text-gray-300' };
}

// 判断是否为抢票关键期
// 把节假日和周六日都视为休息区间：
// direction: 'outbound' -> 休息区间后一天去程高峰
// direction: 'return'   -> 休息区间前一天返程高峰
export function getRushInfo(
  date: string,
  direction: import('./types.js').TrainDirection | undefined,
  calendarDays: import('./types.js').CalendarDayInfo[],
): { isRush: boolean; rushText?: string } {
  if (!direction) return { isRush: false };

  // 构建连续休息区间（节假日 + 周末，排除补班日）
  const sorted = [...calendarDays].sort((a, b) => a.date.localeCompare(b.date));
  const ranges: { start: string; end: string; name: string }[] = [];
  for (const d of sorted) {
    if (d.isPublicWorkday) continue; // 补班按工作日算
    if (!d.isHoliday && !d.isWeekend) continue;

    const prev = ranges[ranges.length - 1];
    const prevEnd = prev ? new Date(prev.end + 'T00:00:00') : null;
    const curr = new Date(d.date + 'T00:00:00');
    if (prev && prevEnd && curr.getTime() - prevEnd.getTime() === 24 * 60 * 60 * 1000) {
      prev.end = d.date;
    } else {
      ranges.push({ start: d.date, end: d.date, name: d.holidayName || '周末' });
    }
  }

  const current = new Date(date + 'T00:00:00');

  for (const range of ranges) {
    if (direction === 'return') {
      const target = new Date(range.start + 'T00:00:00');
      target.setDate(target.getDate() - 1); // 休息区间前一天（返程高峰）
      if (current.getTime() === target.getTime()) {
        return { isRush: true, rushText: `${range.name}抢票` };
      }
    }

    if (direction === 'outbound') {
      const target = new Date(range.end + 'T00:00:00');
      target.setDate(target.getDate() + 1); // 休息区间后一天（去程高峰）
      if (current.getTime() === target.getTime()) {
        return { isRush: true, rushText: `${range.name}抢票` };
      }
    }
  }

  return { isRush: false };
}
