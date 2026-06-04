import { memo, useCallback, useRef } from 'react';
import { formatTime, seatDisplay, STATUS_LABELS } from '../../shared/utils.js';
import type { TicketGroup, TrainConfig, CellStatus } from '../../shared/types.js';

interface TicketCellProps {
  train: TrainConfig;
  date: string;
  ticket: TicketGroup | undefined;
  rowBg?: string;
  onContextMenu: (
    trainNo: string,
    date: string,
    status: CellStatus,
    defaultSeat: string,
    x: number,
    y: number,
  ) => void;
}

// 判断座位是否有票
function hasTicket(available: number | string | undefined): boolean {
  if (available === undefined) return false;
  if (available === '有') return true;
  if (typeof available === 'number' && available > 0) return true;
  return false;
}

// 判断是否已过发车时间
function isExpired(date: string, departureTime?: string): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cellDate = new Date(date + 'T00:00:00');

  if (cellDate < today) return true;

  if (cellDate.getTime() === today.getTime() && departureTime) {
    const [h, m] = departureTime.split(':').map(Number);
    const trainTime = new Date(today);
    trainTime.setHours(h, m, 0, 0);
    return now > trainTime;
  }

  return false;
}

const STATUS_STYLES: Record<CellStatus, { bg: string; text: string; border?: string }> = {
  none: { bg: '', text: '' },
  bought: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  waiting: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  skipped: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
};

export const TicketCell = memo(function TicketCell({
  train,
  date,
  ticket,
  rowBg,
  onContextMenu,
}: TicketCellProps) {
  const status: CellStatus = ticket?.status || (ticket?.bought ? 'bought' : 'none');
  const defaultSeat = train.seatTypes[0];
  const expired = isExpired(date, ticket?.departureTime);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  // 长按检测
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (expired) return;
      isLongPress.current = false;
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        onContextMenu(train.trainNo, date, status, defaultSeat, e.clientX, e.clientY);
      }, 500);
    },
    [expired, train.trainNo, date, status, defaultSeat, onContextMenu],
  );

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // 右键菜单
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (expired) return;
      e.preventDefault();
      onContextMenu(train.trainNo, date, status, defaultSeat, e.clientX, e.clientY);
    },
    [expired, train.trainNo, date, status, defaultSeat, onContextMenu],
  );

  // 主座位
  const st = train.seatTypes[0];
  const seat = ticket?.seats[st];
  const seatAvailable = seat?.available;

  // 无座
  const wzSeat = ticket?.seats['wz'];
  const wzAvailable = wzSeat?.available;

  // 是否已开售
  const hasAnyData = ticket
    ? Object.values(ticket.seats).some((s) => s.available !== '--')
    : false;

  // 候补判断
  const isHoubu = seatAvailable === '候补' || (hasAnyData && seatAvailable === '--');
  const seatHasTicket = hasTicket(seatAvailable);
  const wzHasTicket = hasTicket(wzAvailable);

  // 紧凑显示无座
  const wzCompact = wzHasTicket
    ? typeof wzAvailable === 'number'
      ? `无座${wzAvailable}`
      : '无座有'
    : null;

  // 采集时间
  let activeQt: string | undefined;
  if (seatHasTicket) activeQt = seat?.queryTime;
  else if (wzHasTicket) activeQt = wzSeat?.queryTime;
  else activeQt = seat?.queryTime ?? wzSeat?.queryTime;

  // 已过状态
  if (expired) {
    return (
      <td className="px-2 py-3 text-center align-middle select-none bg-gray-50 border-r last:border-r-0">
        <span className="text-sm text-gray-300">已过</span>
      </td>
    );
  }

  // 主文字渲染（仅 status=none 时显示余票信息）
  const mainContent = (() => {
    if (status !== 'none') {
      return <span className="text-sm font-medium">{STATUS_LABELS[status]}</span>;
    }
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
      return <span className="text-sm text-orange-500">候补</span>;
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

  const style = STATUS_STYLES[status];
  const bgClass = style.bg
    ? `${style.bg} ${style.border ? `border ${style.border}` : ''}`
    : rowBg || '';

  return (
    <td
      className={`relative px-2 py-3 text-center align-middle cursor-pointer select-none border-r last:border-r-0 transition-colors ${bgClass}`}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      title={`长按设置状态 | ${activeQt ? `采集于 ${formatTime(activeQt)}` : '尚未采集'}`}
    >
      <div className={`flex flex-col items-center gap-0.5 ${style.text}`}>{mainContent}</div>
      {status === 'none' && (isHoubu || activeQt) && (
        <div className="absolute bottom-0.5 right-1 text-[8px] leading-none flex items-center gap-1">
          {isHoubu && wzCompact && <span className="text-green-600">{wzCompact}</span>}
          {activeQt && <span className="text-gray-300">{formatTime(activeQt)}</span>}
        </div>
      )}
    </td>
  );
});
