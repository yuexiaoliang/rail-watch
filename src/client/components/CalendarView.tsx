import { memo, useState, useCallback, useEffect } from 'react';
import { Calendar, Briefcase, PartyPopper, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api.js';
import { Input } from '../components/ui/input.js';
import { Switch } from '../components/ui/switch.js';
import type { CalendarResult, CalendarDayInfo } from '../../shared/types.js';

const WEEK_HEADERS = ['一', '二', '三', '四', '五', '六', '日'];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function getDayClasses(day: CalendarDayInfo, isToday: boolean): string {
  const classes: string[] = ['relative', 'h-20', 'p-2', 'border', 'rounded-lg', 'flex', 'flex-col', 'justify-between'];

  if (day.specialTag) {
    // 回乡/返京 — 红色背景
    classes.push('bg-red-50', 'border-red-200');
  } else if (day.isHoliday) {
    // 节假日
    classes.push('bg-red-50/60', 'border-red-100');
  } else if (day.isPublicWorkday) {
    // 补班日
    classes.push('bg-amber-50', 'border-amber-200');
  } else if (day.isWeekend) {
    // 普通周末
    classes.push('bg-blue-50/50', 'border-blue-100');
  } else {
    // 普通工作日
    classes.push('bg-white', 'border-gray-100');
  }

  if (isToday) {
    classes.push('ring-2', 'ring-primary', 'ring-offset-1');
  }

  return classes.join(' ');
}

export const CalendarView = memo(function CalendarView() {
  const [baseDate, setBaseDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [calendar, setCalendar] = useState<CalendarResult | null>(null);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCalendar(baseDate, 30);
      setCalendar(data);
    } catch (e) {
      console.error('Calendar fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [baseDate]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // 切换基准日期
  const shiftDate = useCallback((days: number) => {
    const d = new Date(baseDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setBaseDate(s);
  }, [baseDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">加载中...</div>
    );
  }

  if (!calendar) return null;

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  // 过滤后的天数（隐藏周末时保留补班日）
  const visibleDays = hideWeekends
    ? calendar.days.filter((d) => !d.isWeekend || d.isPublicWorkday)
    : calendar.days;

  // 构建日历网格：需要找出覆盖的周范围
  const firstDate = new Date(calendar.days[0].date + 'T00:00:00');
  // 周一开始 (0=日, 1=一... 所以周一的偏移是：如果当天是周日(0)，前推6天；否则前推 day-1 天)
  const firstDayOfWeek = firstDate.getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const gridStart = new Date(firstDate);
  gridStart.setDate(gridStart.getDate() - startOffset);

  // 计算需要多少行
  const lastVisibleDate = new Date(visibleDays[visibleDays.length - 1]?.date + 'T00:00:00');
  const totalDays = Math.max(
    35,
    Math.ceil(
      (lastVisibleDate.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1,
  );

  // 生成完整的网格日期
  const gridDates: { dateStr: string; inRange: boolean; dayInfo?: CalendarDayInfo }[] = [];
  const dayMap = new Map(calendar.days.map((d) => [d.date, d]));

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayInfo = dayMap.get(s);
    gridDates.push({
      dateStr: s,
      inRange: !!dayInfo,
      dayInfo,
    });
  }

  // 按周分组
  const weeks: typeof gridDates[] = [];
  for (let i = 0; i < gridDates.length; i += 7) {
    weeks.push(gridDates.slice(i, i + 7));
  }

  // 如果隐藏周末，过滤掉纯周末列（保留节假日和补班日）
  const displayWeeks = hideWeekends
    ? weeks.map((week) =>
        week.map((cell) => {
          if (!cell.inRange) return cell;
          const di = cell.dayInfo;
          // 只隐藏：是周末 且 不是节假日 且 不是补班日
          if (di?.isWeekend && !di?.isHoliday && !di?.isPublicWorkday) {
            return { ...cell, inRange: false, dayInfo: undefined };
          }
          return cell;
        }),
      )
    : weeks;

  return (
    <div className="space-y-6">
      {/* 控制栏 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            onClick={() => shiftDate(-1)}
            title="前一天"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Input
            type="date"
            value={baseDate}
            onChange={(e) => setBaseDate(e.target.value)}
            className="w-40"
          />
          <button
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            onClick={() => shiftDate(1)}
            title="后一天"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="cal-hide-weekends"
            checked={hideWeekends}
            onCheckedChange={setHideWeekends}
          />
          <label htmlFor="cal-hide-weekends" className="text-sm text-muted-foreground cursor-pointer">
            隐藏周六日
          </label>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">工作日总数</p>
            <p className="text-2xl font-bold">{calendar.workdayCount}</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <PartyPopper className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">节假日</p>
            <p className="text-2xl font-bold">{calendar.holidayRanges.length} 个</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">统计周期</p>
            <p className="text-lg font-bold">
              {formatDateLabel(calendar.baseDate)} ~ {formatDateLabel(calendar.days[calendar.days.length - 1].date)}
            </p>
          </div>
        </div>
      </div>

      {/* 节假日列表 */}
      {calendar.holidayRanges.length > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-red-500" />
            节假日安排
          </h3>
          <div className="space-y-2">
            {calendar.holidayRanges.map((range) => (
              <div
                key={range.name + range.startDate}
                className="flex items-center gap-4 text-sm"
              >
                <span className="font-medium min-w-[4rem]">{range.name}</span>
                <span className="text-muted-foreground">
                  {formatDateLabel(range.startDate)} ~ {formatDateLabel(range.endDate)}
                </span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {range.days}天
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 日历网格 */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="font-medium">{getMonthLabel(baseDate)} 日历</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200 inline-block" /> 回乡/返京
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-red-50/60 border border-red-100 inline-block" /> 节假日
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 inline-block" /> 补班
            </span>
          </div>
        </div>

        <div className="p-4">
          {/* 表头 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEK_HEADERS.map((h) => (
              <div key={h} className="text-center text-xs text-muted-foreground py-1 font-medium">
                {h}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="space-y-1">
            {displayWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1">
                {week.map((cell) => {
                  if (!cell.inRange || !cell.dayInfo) {
                    return (
                      <div
                        key={cell.dateStr}
                        className="h-20 border border-transparent rounded-lg"
                      />
                    );
                  }
                  const day = cell.dayInfo;
                  const isToday = cell.dateStr === todayStr;
                  const dayNum = new Date(cell.dateStr + 'T00:00:00').getDate();

                  return (
                    <div
                      key={cell.dateStr}
                      className={getDayClasses(day, isToday)}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                          {dayNum}
                        </span>
                        {day.isPublicWorkday && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 rounded">班</span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {day.specialTag && (
                          <div className="text-[10px] font-medium text-red-700 leading-tight">
                            {day.specialTag}
                          </div>
                        )}
                        {day.holidayName && !day.specialTag && (
                          <div className="text-[10px] text-red-600 leading-tight">
                            {day.holidayName}
                          </div>
                        )}
                        {day.isWorkday && !day.isPublicWorkday && !day.isHoliday && (
                          <div className="text-[10px] text-muted-foreground leading-tight">工作日</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
