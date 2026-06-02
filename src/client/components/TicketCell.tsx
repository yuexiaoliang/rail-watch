import { memo, useCallback } from 'react';
import { formatTime, seatDisplay, getRushInfo } from '../../shared/utils.js';
import { Badge } from '../components/ui/badge.js';
import type { TicketGroup, TrainConfig } from '../../shared/types.js';

interface TicketCellProps {
  train: TrainConfig;
  date: string;
  ticket: TicketGroup | undefined;
  holidays: Record<string, string>;
  onToggleBought: (trainNo: string, date: string, isBought: boolean, defaultSeat?: string) => void;
}

export const TicketCell = memo(function TicketCell({
  train,
  date,
  ticket,
  holidays,
  onToggleBought,
}: TicketCellProps) {
  const isBought = ticket?.bought || false;
  const defaultSeat = train.seatTypes[0];
  const st = train.seatTypes[0];
  const seat = ticket?.seats[st];
  const disp = seatDisplay(seat?.available);
  const isLow = typeof seat?.available === 'number' && seat.available > 0 && seat.available <= 5;
  const rush = getRushInfo(date, train.fromStation, train.toStation, holidays);
  const qt = ticket?.seats[st]?.queryTime;
  const timeStr = qt ? `采集于 ${formatTime(qt)}` : '尚未采集';
  const title = isBought ? `双击取消已购 | ${timeStr}` : `双击标记已购 | ${timeStr}`;

  const handleDoubleClick = useCallback(() => {
    onToggleBought(train.trainNo, date, isBought, defaultSeat);
  }, [train.trainNo, date, isBought, defaultSeat, onToggleBought]);

  const timeSmall = qt ? <div className="text-[10px] text-muted-foreground mt-0.5">{formatTime(qt)}</div> : null;

  return (
    <td
      className="px-2 py-3 text-center align-middle cursor-pointer select-none"
      onDoubleClick={handleDoubleClick}
      title={title}
    >
      {isBought ? (
        <div className="flex flex-col items-center gap-1">
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">已购</Badge>
        </div>
      ) : rush.isRush ? (
        <div className="flex flex-col items-center gap-1">
          <span className={`text-base font-medium ${isLow ? 'text-orange-600 font-bold' : disp.color}`}>{disp.text}</span>
          <Badge variant="destructive" className="text-[10px]">{rush.rushText}</Badge>
          {timeSmall}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span className={`text-base font-medium ${isLow ? 'text-orange-600 font-bold' : disp.color}`}>{disp.text}</span>
          {timeSmall}
        </div>
      )}
    </td>
  );
});
