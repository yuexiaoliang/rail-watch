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

  // 判断座位是否有票（排除候补状态）
  function hasTicket(available: number | string | undefined): boolean {
    if (available === undefined || available === '候补') return false;
    if (available === '有') return true;
    return typeof available === 'number' && available > 0;
  }

  // 1. 配置的主座位
  const st = train.seatTypes[0];
  const seat = ticket?.seats[st];
  const seatAvailable = seat?.available;

  // 2. 无座
  const wzSeat = ticket?.seats['wz'];
  const wzAvailable = wzSeat?.available;

  // 3. 判断状态
  const isHoubu = seatAvailable === '候补';
  const seatHasTicket = hasTicket(seatAvailable);
  const wzHasTicket = hasTicket(wzAvailable);

  let displayText: string;
  let displayColor: string;
  let isLow = false;
  let activeQt: string | undefined;

  if (seatHasTicket) {
    // 主座位有票，正常显示
    const d = seatDisplay(seatAvailable);
    displayText = d.text;
    displayColor = d.color;
    isLow = typeof seatAvailable === 'number' && seatAvailable > 0 && seatAvailable <= 5;
    activeQt = seat?.queryTime;
  } else if (isHoubu) {
    // 主座位是候补状态
    activeQt = seat?.queryTime;
    if (wzHasTicket) {
      // 候补 + 无座有票
      const d = seatDisplay(wzAvailable);
      displayText = `候补 无座 ${d.text}`;
      displayColor = 'text-orange-500';
      isLow = typeof wzAvailable === 'number' && wzAvailable > 0 && wzAvailable <= 5;
      activeQt = wzSeat?.queryTime;
    } else {
      displayText = '候补';
      displayColor = 'text-orange-500';
    }
  } else if (wzHasTicket) {
    // 无候补，只显示无座
    const d = seatDisplay(wzAvailable);
    displayText = `无座 ${d.text}`;
    displayColor = d.color;
    isLow = typeof wzAvailable === 'number' && wzAvailable > 0 && wzAvailable <= 5;
    activeQt = wzSeat?.queryTime;
  } else {
    // 什么都没有
    displayText = '无';
    displayColor = 'text-gray-400';
    activeQt = seat?.queryTime ?? wzSeat?.queryTime;
  }

  const rush = getRushInfo(date, train.fromStation, train.toStation, holidays);
  const timeStr = activeQt ? `采集于 ${formatTime(activeQt)}` : '尚未采集';
  const title = isBought ? `双击取消已购 | ${timeStr}` : `双击标记已购 | ${timeStr}`;

  const handleDoubleClick = useCallback(() => {
    onToggleBought(train.trainNo, date, isBought, defaultSeat);
  }, [train.trainNo, date, isBought, defaultSeat, onToggleBought]);

  const timeSmall = activeQt ? (
    <div className="text-[10px] text-muted-foreground mt-0.5">{formatTime(activeQt)}</div>
  ) : null;

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
          <span className={`text-base font-medium ${isLow ? 'text-orange-600 font-bold' : displayColor}`}>{displayText}</span>
          <Badge variant="destructive" className="text-[10px]">{rush.rushText}</Badge>
          {timeSmall}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span className={`text-base font-medium ${isLow ? 'text-orange-600 font-bold' : displayColor}`}>{displayText}</span>
          {timeSmall}
        </div>
      )}
    </td>
  );
});
