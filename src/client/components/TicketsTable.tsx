import { memo } from 'react';
import { formatDate } from '../../shared/utils.js';
import { TicketCell } from './TicketCell.js';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import type { TicketGroup, TrainConfig } from '../../shared/types.js';

interface TicketsTableProps {
  trains: TrainConfig[];
  tickets: TicketGroup[];
  dates: string[];
  holidays: Record<string, string>;
  hideHolidays: boolean;
  hideWeekends: boolean;
  onToggleBought: (trainNo: string, date: string, isBought: boolean, defaultSeat?: string) => void;
}

export const TicketsTable = memo(function TicketsTable({
  trains,
  tickets,
  dates,
  holidays,
  hideHolidays,
  hideWeekends,
  onToggleBought,
}: TicketsTableProps) {
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

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-24 sticky left-0 bg-muted/50 z-10 border-r">日期</TableHead>
            {trains.map((train) => (
              <TableHead key={train.id} className="text-center min-w-[100px]">
                <div className="font-bold">{train.trainNo}</div>
                <div className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                  {train.fromStation} → {train.toStation}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDates.map((date) => (
            <TableRow key={date}>
              <td className="px-3 py-3 whitespace-nowrap font-medium sticky left-0 bg-background border-r z-10 w-24">
                <div>{formatDate(date)}</div>
                {holidays[date] && (
                  <div className="text-xs text-orange-500 mt-0.5">{holidays[date]}</div>
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
                    holidays={holidays}
                    onToggleBought={onToggleBought}
                  />
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
