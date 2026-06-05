import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { DayPicker, useDayRender } from 'react-day-picker';
import { zhCN } from 'date-fns/locale';
import { api } from '../api.js';
import { Calendar, Briefcase, PartyPopper } from 'lucide-react';
import type { CalendarResult, CalendarDayInfo } from '../../shared/types.js';
import type { DayProps } from 'react-day-picker';

interface CalendarViewProps {
  onDateClick?: (date: string) => void;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const CalendarView = memo(function CalendarView({ onDateClick }: CalendarViewProps) {
  const [calendar, setCalendar] = useState<CalendarResult | null>(null);
  const [month, setMonth] = useState(new Date());

  const fetchCalendar = useCallback(async () => {
    try {
      const base = ymd(month);
      const data = await api.getCalendar(base, 30);
      setCalendar(data);
    } catch (e) {
      console.error('Calendar fetch error:', e);
    }
  }, [month]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  if (!calendar) return null;

  // 构建 modifiers
  const holidays: Date[] = [];
  const publicWorkdays: Date[] = [];
  const homeDates: Date[] = [];
  const returnDates: Date[] = [];
  const dayMap = new Map<string, CalendarDayInfo>();

  for (const d of calendar.days) {
    const date = new Date(d.date + 'T00:00:00');
    dayMap.set(d.date, d);
    if (d.isHoliday) holidays.push(date);
    if (d.isPublicWorkday) publicWorkdays.push(date);
    if (d.specialTag?.includes('回乡')) homeDates.push(date);
    if (d.specialTag?.includes('返京')) returnDates.push(date);
  }

  // 自定义 Day 组件
  const CustomDay = ({ date, displayMonth }: DayProps) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dayRender = useDayRender(date, displayMonth, buttonRef);
    const s = ymd(date);
    const info = dayMap.get(s);

    const tag = info?.specialTag
      ? info.specialTag.replace(/(回乡|返京)$/, '')
      : info?.holidayName || null;

    if (dayRender.isHidden) {
      return <div role="gridcell" />;
    }

    if (!dayRender.isButton) {
      return <div {...dayRender.divProps} />;
    }

    return (
      <button
        ref={buttonRef}
        {...dayRender.buttonProps}
        onClick={(e) => {
          onDateClick?.(s);
          dayRender.buttonProps.onClick?.(e);
        }}
        className={`${dayRender.buttonProps.className || ''} flex flex-col items-center justify-center gap-0.5`}
        title={info?.specialTag || info?.holidayName || undefined}
      >
        <span>{date.getDate()}</span>
        {tag && (
          <span className="text-[8px] leading-none truncate max-w-full px-0.5">
            {tag}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4 w-full lg:w-[320px] shrink-0">
      {/* 日历 */}
      <div className="bg-card border rounded-xl p-3">
        <style>{`
          .rdp { margin: 0; --rdp-cell-size: 44px; --rdp-accent-color: hsl(var(--primary)); --rdp-background-color: hsl(var(--accent)); }
          .rdp-months { justify-content: center; }
          .rdp-caption { padding: 0 0 8px; }
          .rdp-caption_label { font-size: 14px; font-weight: 600; }
          .rdp-nav_button { width: 28px; height: 28px; }
          .rdp-head_cell { font-size: 11px; color: hsl(var(--muted-foreground)); padding: 4px 0; }
          .rdp-cell { padding: 1px; }
          .rdp-day_holiday button { background: rgb(254 242 242); color: rgb(185 28 28); border: 1px solid rgb(254 202 202); }
          .rdp-day_holiday button:hover { background: rgb(254 226 226); }
          .rdp-day_work button { background: rgb(255 251 235); color: rgb(180 83 9); border: 1px solid rgb(253 230 138); }
          .rdp-day_work button:hover { background: rgb(254 243 199); }
          .rdp-day_home button, .rdp-day_return button { background: rgb(254 242 242) !important; color: rgb(153 27 27) !important; border: 1px solid rgb(252 165 165) !important; font-weight: 600; }
          .rdp-day_home button:hover, .rdp-day_return button:hover { background: rgb(254 226 226) !important; }
          .rdp-day_today button { font-weight: 700; color: hsl(var(--primary)); position: relative; }
          .rdp-day_today button::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: hsl(var(--primary));
          }
        `}</style>
        <DayPicker
          mode="single"
          month={month}
          onMonthChange={setMonth}
          locale={zhCN}
          showOutsideDays
          fixedWeeks
          weekStartsOn={1}
          modifiers={{
            holiday: holidays,
            publicWorkday: publicWorkdays,
            home: homeDates,
            return: returnDates,
          }}
          modifiersClassNames={{
            holiday: 'rdp-day_holiday',
            publicWorkday: 'rdp-day_work',
            home: 'rdp-day_home',
            return: 'rdp-day_return',
          }}
          components={{
            Day: CustomDay,
          }}
        />
      </div>

      {/* 统计卡片 */}
      <div className="space-y-3">
        <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">工作日总数</p>
            <p className="text-lg font-bold">{calendar.workdayCount}</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <PartyPopper className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">节假日</p>
            <p className="text-lg font-bold">{calendar.holidayRanges.length} 个</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">统计周期</p>
            <p className="text-xs font-medium">
              {calendar.baseDate.slice(5).replace('-', '/')} ~ {calendar.days[calendar.days.length - 1].date.slice(5).replace('-', '/')}
            </p>
          </div>
        </div>
      </div>

      {/* 节假日列表 */}
      {calendar.holidayRanges.length > 0 && (
        <div className="bg-card border rounded-xl p-3">
          <h3 className="text-xs font-medium mb-2 text-muted-foreground">节假日安排</h3>
          <div className="space-y-1.5">
            {calendar.holidayRanges.map((range) => (
              <div key={range.name + range.startDate} className="flex items-center gap-2 text-xs">
                <span className="font-medium min-w-[3rem]">{range.name}</span>
                <span className="text-muted-foreground">
                  {range.startDate.slice(5).replace('-', '/')}~{range.endDate.slice(5).replace('-', '/')}
                </span>
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{range.days}天</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 图例 */}
      <div className="bg-card border rounded-xl p-3">
        <h3 className="text-xs font-medium mb-2 text-muted-foreground">图例</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200 inline-block" /> 回乡/返京
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-100 inline-block" /> 节假日
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 inline-block" /> 补班
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-blue-50 border border-blue-100 inline-block" /> 周末
          </span>
        </div>
      </div>
    </div>
  );
});
