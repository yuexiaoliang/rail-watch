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
export function getRushInfo(
  date: string,
  fromStation: string,
  toStation: string,
  holidays: Record<string, string>,
): { isRush: boolean; rushText?: string } {
  const isDepart = fromStation.includes('张家口') && !toStation.includes('张家口');
  const isReturn = !fromStation.includes('张家口') && toStation.includes('张家口');
  const current = new Date(date + 'T00:00:00');

  for (const [holidayDate, name] of Object.entries(holidays)) {
    const hd = new Date(holidayDate + 'T00:00:00');

    if (isReturn) {
      const target = new Date(hd);
      target.setDate(target.getDate() - 1);
      const diffDays = (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 15) {
        return { isRush: true, rushText: `${name}抢票` };
      }
    }

    if (isDepart) {
      const target = new Date(hd);
      target.setDate(target.getDate() + 1);
      const diffDays = (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 15) {
        return { isRush: true, rushText: `${name}抢票` };
      }
    }
  }

  return { isRush: false };
}
