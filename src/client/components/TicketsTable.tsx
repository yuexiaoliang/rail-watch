import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatDate, STATUS_LABELS } from '../../shared/utils.js';
import { TicketCell } from './TicketCell.js';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import type { TicketGroup, TrainConfig, CellStatus, CalendarDayInfo } from '../../shared/types.js';

interface TicketsTableProps {
  trains: TrainConfig[];
  tickets: TicketGroup[];
  dates: string[];
  holidays: Record<string, string>;
  calendarDays: CalendarDayInfo[];
  hideHolidays: boolean;
  hideWeekends: boolean;
  onSetCellStatus: (trainNo: string, date: string, status: CellStatus, defaultSeat?: string) => void;
}

const MENU_ITEMS: { status: CellStatus; label: string; className: string }[] = [
  { status: 'none', label: STATUS_LABELS.none, className: '' },
  { status: 'bought', label: STATUS_LABELS.bought, className: 'text-emerald-600' },
  { status: 'waiting', label: STATUS_LABELS.waiting, className: 'text-orange-600' },
  { status: 'skipped', label: STATUS_LABELS.skipped, className: 'text-gray-500' },
];

export const TicketsTable = memo(function TicketsTable({
  trains,
  tickets,
  dates,
  holidays,
  calendarDays,
  hideHolidays,
  hideWeekends,
  onSetCellStatus,
}: TicketsTableProps) {
  const [contextMenu, setContextMenu] = useState<{
    trainNo: string;
    date: string;
    status: CellStatus;
    defaultSeat: string;
    x: number;
    y: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const dayMap = new Map(calendarDays.map((d) => [d.date, d]));

  const filteredDates = dates.filter((date) => {
    const hasBoughtOnDate = trains.some((train) => {
      const t = tickets.find((x) => x.trainNo === train.trainNo && x.date === date);
      return t?.bought;
    });
    if (hideHolidays && holidays[date] && !hasBoughtOnDate) return false;
    if (hideWeekends) {
      const dayInfo = dayMap.get(date);
      const isWeekend = dayInfo?.isWeekend ?? false;
      const isPublicWorkday = dayInfo?.isPublicWorkday ?? false;
      // 只隐藏普通周末，保留补班日
      if (isWeekend && !isPublicWorkday && !hasBoughtOnDate) return false;
    }
    return true;
  });

  // 点击外部关闭菜单
  useEffect(() => {
    if (!contextMenu) return;
    const handleDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [contextMenu]);

  const handleCellContextMenu = useCallback(
    (trainNo: string, date: string, status: CellStatus, defaultSeat: string, x: number, y: number) => {
      setContextMenu({ trainNo, date, status, defaultSeat, x, y });
    },
    [],
  );

  const handleMenuSelect = useCallback(
    (newStatus: CellStatus) => {
      if (!contextMenu) return;
      onSetCellStatus(contextMenu.trainNo, contextMenu.date, newStatus, contextMenu.defaultSeat);
      setContextMenu(null);
    },
    [contextMenu, onSetCellStatus],
  );

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 relative">
            <TableHead className="w-28 sticky left-0 bg-muted z-20 border-r py-2">日期</TableHead>
            {trains.map((train, idx) => (
              <TableHead
                key={train.id}
                className={`text-center min-w-[100px] py-2 relative z-0 ${idx < trains.length - 1 ? 'border-r' : ''}`}
              >
                <div className="font-bold text-base">{train.trainNo}</div>
                <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                  {train.fromStation} → {train.toStation}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDates.map((date) => {
            const isHoliday = !!holidays[date];
            const day = new Date(date + 'T00:00:00').getDay();
            const isWeekend = day === 0 || day === 6;
            const dayInfo = dayMap.get(date);

            // 整行背景：节假日优先于周末
            let rowBg = '';
            if (isHoliday) rowBg = 'bg-red-50/60';
            else if (isWeekend) rowBg = 'bg-blue-50/50';

            // 日期列额外标记
            const extraTag = dayInfo?.specialTag || (dayInfo?.isPublicWorkday ? '班' : null);

            return (
              <TableRow key={date} className={`hover:bg-transparent ${rowBg}`}>
                <td
                  className={`px-3 py-2 whitespace-nowrap font-medium sticky left-0 border-r z-20 w-28 ${
                    isHoliday ? 'bg-red-50 text-red-700' : isWeekend ? 'bg-blue-50/80' : 'bg-background'
                  }`}
                >
                  <div>{formatDate(date)}</div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {isHoliday && (
                      <span className="text-[10px] text-red-600 font-medium">{holidays[date]}</span>
                    )}
                    {extraTag && (
                      <span className={`text-[10px] font-medium ${
                        dayInfo?.specialTag?.includes('回乡') || dayInfo?.specialTag?.includes('返京')
                          ? 'text-red-700 bg-red-100 px-1 rounded'
                          : dayInfo?.isPublicWorkday
                          ? 'text-amber-700 bg-amber-100 px-1 rounded'
                          : ''
                      }`}>
                        {extraTag}
                      </span>
                    )}
                  </div>
                </td>
                {trains.map((train) => {
                  const ticket = tickets.find((t) => t.trainNo === train.trainNo && t.date === date);
                  return (
                    <TicketCell
                      key={train.id}
                      train={train}
                      date={date}
                      ticket={ticket}
                      rowBg={rowBg}
                      onContextMenu={handleCellContextMenu}
                    />
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* 全局单例菜单 — 通过 Portal 挂载到 body */}
      {contextMenu &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 bg-popover border rounded-lg shadow-lg py-1 w-[120px]"
            style={{
              left: Math.min(contextMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 120),
              top: Math.min(contextMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 160),
            }}
          >
            {MENU_ITEMS.map((item) => (
              <button
                key={item.status}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                  contextMenu.status === item.status ? 'bg-accent font-medium' : ''
                } ${item.className}`}
                onClick={() => handleMenuSelect(item.status)}
              >
                <span className="inline-block w-4">
                  {contextMenu.status === item.status && '✓'}
                </span>
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
});
