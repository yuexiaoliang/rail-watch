import { holiday } from '@kang8/chinese-holidays';

export interface CalendarDayInfo {
  date: string;
  dayOfWeek: number; // 0=日, 1=一, ..., 6=六
  dayName: string;
  isHoliday: boolean; // 法定节假日（不含周末）
  isWeekend: boolean;
  isWorkday: boolean; // 工作日（含补班）
  isPublicWorkday: boolean; // 补班日
  holidayName: string | null;
  specialTag: string | null; // "xx节回乡" | "xx节返京"
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

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface DayData {
  name: string;
  type: 'publicHoliday' | 'publicWorkday';
}

/** 从 holiday.data 获取某天的完整信息 */
function getDayData(dateStr: string): DayData | null {
  const d = new Date(dateStr + 'T00:00:00');
  const yearMap = (holiday as unknown as { data: Map<number, { date: Map<string, DayData> }> }).data.get(d.getFullYear());
  if (!yearMap) return null;
  return yearMap.date.get(dateStr) || null;
}

/**
 * 生成指定日期往后 N 天的日历数据
 */
export function generateCalendar(baseDate?: string, days = 30): CalendarResult {
  const base = baseDate ? new Date(baseDate + 'T00:00:00') : new Date();
  // 归一化到当天的 00:00:00
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());

  // 先生成原始日期列表
  const dateList: string[] = [];
  const dateMap = new Map<string, Date>();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const s = formatDateYMD(d);
    dateList.push(s);
    dateMap.set(s, d);
  }

  // 收集节假日信息（含补班日）
  const holidayInfo = new Map<string, DayData>();
  for (const s of dateList) {
    const data = getDayData(s);
    if (data) holidayInfo.set(s, data);
  }

  // 计算节假日连续范围（需要前后扩展查找）
  const holidayRanges: HolidayRange[] = [];
  const visited = new Set<string>();

  for (const [dateStr, data] of holidayInfo) {
    if (data.type === 'publicWorkday') continue;
    if (visited.has(dateStr)) continue;

    const name = data.name;
    // 向前找同名的节假日
    let start = new Date(dateStr + 'T00:00:00');
    while (true) {
      const prev = new Date(start);
      prev.setDate(prev.getDate() - 1);
      const prevStr = formatDateYMD(prev);
      const prevData = getDayData(prevStr);
      if (prevData && prevData.type === 'publicHoliday' && prevData.name === name) {
        start = prev;
      } else {
        break;
      }
    }

    // 向后找同名的节假日
    let end = new Date(dateStr + 'T00:00:00');
    while (true) {
      const next = new Date(end);
      next.setDate(next.getDate() + 1);
      const nextStr = formatDateYMD(next);
      const nextData = getDayData(nextStr);
      if (nextData && nextData.type === 'publicHoliday' && nextData.name === name) {
        end = next;
      } else {
        break;
      }
    }

    const startStr = formatDateYMD(start);
    const endStr = formatDateYMD(end);

    // 标记所有已访问
    let cur = new Date(start);
    while (cur <= end) {
      visited.add(formatDateYMD(cur));
      cur.setDate(cur.getDate() + 1);
    }

    holidayRanges.push({
      name,
      startDate: startStr,
      endDate: endStr,
      days: Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    });
  }

  // 计算回乡日和返京日
  const specialTags = new Map<string, string>();
  for (const range of holidayRanges) {
    const prev = new Date(range.startDate + 'T00:00:00');
    prev.setDate(prev.getDate() - 1);
    const prevStr = formatDateYMD(prev);
    if (dateList.includes(prevStr)) {
      specialTags.set(prevStr, `${range.name}回乡`);
    }

    const next = new Date(range.endDate + 'T00:00:00');
    next.setDate(next.getDate() + 1);
    const nextStr = formatDateYMD(next);
    if (dateList.includes(nextStr)) {
      specialTags.set(nextStr, `${range.name}返京`);
    }
  }

  // 组装每天的数据
  const dayInfos: CalendarDayInfo[] = dateList.map((s) => {
    const d = dateMap.get(s)!;
    const dayOfWeek = d.getDay();
    const data = holidayInfo.get(s);
    const isPublicWorkday = data?.type === 'publicWorkday';
    const isHoliday = data?.type === 'publicHoliday';
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      date: s,
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek],
      isHoliday,
      isWeekend,
      isWorkday: !isHoliday && (!isWeekend || isPublicWorkday),
      isPublicWorkday,
      holidayName: data?.type === 'publicHoliday' ? data.name : null,
      specialTag: specialTags.get(s) || null,
    };
  });

  // 工作日统计：isWorkday 为 true 的天数
  const workdayCount = dayInfos.filter((d) => d.isWorkday).length;

  return {
    baseDate: formatDateYMD(today),
    days: dayInfos,
    workdayCount,
    holidayRanges,
  };
}
