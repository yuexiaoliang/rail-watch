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

  // 判断座位是否有票
  function hasTicket(available: number | string | undefined): boolean {
    if (available === undefined) return false;
    if (available === '有') return true;
    if (typeof available === 'number' && available > 0) return true;
    return false;
  }

  // 1. 配置的主座位
  const st = train.seatTypes[0];
  const seat = ticket?.seats[st];
  const seatAvailable = seat?.available;

  // 2. 无座
  const wzSeat = ticket?.seats['wz'];
  const wzAvailable = wzSeat?.available;

  // 3. 判断状态
  // 是否已开售：任一座位有有效数据（scraper 会把已开售无票标为 '候补'）
  const hasAnyData = ticket
    ? Object.values(ticket.seats).some((s) => s.available !== '--')
    : false;

  // 候补：scraper 已标记 '候补'，或已开售但返回 '--'（容错）
  const isHoubu = seatAvailable === '候补' || (hasAnyData && seatAvailable === '--');
  const seatHasTicket = hasTicket(seatAvailable);
  const wzHasTicket = hasTicket(wzAvailable);

  // 紧凑显示无座信息
  const wzCompact = wzHasTicket
    ? typeof wzAvailable === 'number'
      ? `无座${wzAvailable}`
      : '无座有'
    : null;

  const rush = getRushInfo(date, train.fromStation, train.toStation, holidays);

  let activeQt: string | undefined;
  if (seatHasTicket) activeQt = seat?.queryTime;
  else if (wzHasTicket) activeQt = wzSeat?.queryTime;
  else activeQt = seat?.queryTime ?? wzSeat?.queryTime;

  const timeStr = activeQt ? `采集于 ${formatTime(activeQt)}` : '尚未采集';
  const title = isBought ? `双击取消已购 | ${timeStr}` : `双击标记已购 | ${timeStr}`;

  const handleDoubleClick = useCallback(() => {
    onToggleBought(train.trainNo, date, isBought, defaultSeat);
  }, [train.trainNo, date, isBought, defaultSeat, onToggleBought]);

  const timeSmall = activeQt ? (
    <div className="text-[10px] text-muted-foreground mt-0.5">{formatTime(activeQt)}</div>
  ) : null;

  // 主文字渲染
  const mainContent = (() => {
    if (seatHasTicket) {
      const d = seatDisplay(seatAvailable);
      const isLow = typeof seatAvailable === 'number' && seatAvailable > 0 && seatAvailable <= 5;
      return (
        <span className={`text-base font-medium ${isLow ? 'text-orange-600 font-bold' : d.color}`}>
          {d.text}
        </span>
      );
    }
    if (isHoubu) {
      return (
        <div className="flex flex-col items-center leading-none">
          <span className="text-sm text-orange-500">候补</span>
          {wzCompact && (
            <span className="text-[10px] text-green-600 mt-0.5">{wzCompact}</span>
          )}
        </div>
      );
    }
    if (wzHasTicket) {
      const d = seatDisplay(wzAvailable);
      const isLow = typeof wzAvailable === 'number' && wzAvailable > 0 && wzAvailable <= 5;
      return (
        <span className={`text-sm font-medium ${isLow ? 'text-orange-600 font-bold' : d.color}`}>
          {wzCompact}
        </span>
      );
    }
    return <span className="text-sm text-gray-400">无</span>;
  })();

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
          {mainContent}
          <Badge variant="destructive" className="text-[10px]">{rush.rushText}</Badge>
          {timeSmall}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          {mainContent}
          {timeSmall}
        </div>
      )}
    </td>
  );
});
