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
import type { TicketGroup, TrainConfig, CellStatus } from '../../shared/types.js';

interface TicketsTableProps {
  trains: TrainConfig[];
  tickets: TicketGroup[];
  dates: string[];
  holidays: Record<string, string>;
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

  const filteredDates = dates.filter((date) => {
    const hasBoughtOnDate = trains.some((train) => {
      const t = tickets.find((x) => x.trainNo === train.trainNo && x.date === date);
      return t?.bought;
    });
    if (hideHolidays && holidays[date] && !hasBoughtOnDate) return false;
    if (hideWeekends) {
      const d = new Date(date + 'T00:00:00');
      const day = d.getDay();
      if ((day === 0 || day === 6) && !hasBoughtOnDate) return false;
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
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-24 sticky left-0 bg-muted/50 z-10 border-r py-2">日期</TableHead>
            {trains.map((train, idx) => (
              <TableHead
                key={train.id}
                className={`text-center min-w-[100px] py-2 ${idx < trains.length - 1 ? 'border-r' : ''}`}
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

            // 整行背景：节假日优先于周末
            let rowBg = '';
            if (isHoliday) rowBg = 'bg-red-50/60';
            else if (isWeekend) rowBg = 'bg-blue-50/50';

            return (
              <TableRow key={date} className={`hover:bg-transparent ${rowBg}`}>
                <td
                  className={`px-3 py-3 whitespace-nowrap font-medium sticky left-0 border-r z-10 w-24 ${
                    isHoliday ? 'bg-red-50 text-red-700' : isWeekend ? 'bg-blue-50/80' : 'bg-background'
                  }`}
                >
                  <div>{formatDate(date)}</div>
                  {isHoliday && (
                    <div className="text-xs text-red-600 mt-0.5 font-medium">{holidays[date]}</div>
                  )}
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
