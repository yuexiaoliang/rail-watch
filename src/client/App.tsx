import { useState, useEffect, useCallback } from 'react';

interface TrainConfig {
  id: string;
  trainNo: string;
  fromStation: string;
  toStation: string;
  seatTypes: string[];
  enabled: boolean;
}

interface Config {
  trains: TrainConfig[];
  daysAhead: number;
  intervalMinutes: number;
}

interface SeatInfo {
  available: number | string;
  queryTime: string;
}

interface TicketGroup {
  trainNo: string;
  date: string;
  fromStation: string;
  toStation: string;
  seats: Record<string, SeatInfo>;
  bought: boolean;
  boughtSeatType?: string;
}

const SEAT_LABELS: Record<string, string> = {
  ze: '二等座',
  zy: '一等座',
  swz: '商务座',
  yw: '硬卧',
  rw: '软卧',
  yz: '硬座',
  wz: '无座',
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const SEAT_OPTIONS = Object.entries(SEAT_LABELS).map(([key, label]) => ({ key, label }));

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const weekday = WEEKDAYS[d.getDay()];
  return `${month}-${day} ${weekday}`;
}

function formatTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function seatDisplay(available: number | string | undefined): { text: string; color: string } {
  if (available === undefined) return { text: '--', color: 'text-gray-300' };
  if (available === '有') return { text: '有', color: 'text-green-600 font-medium' };
  if (typeof available === 'number') {
    if (available > 0) return { text: String(available), color: 'text-green-600 font-medium' };
    return { text: '0', color: 'text-gray-400' };
  }
  return { text: '--', color: 'text-gray-300' };
}

// 判断是否为抢票关键期：12306提前15天放票
// 返程（北京→张家口）：节假日前15天到节假日前一天
// 去程（张家口→北京）：节假日后15天到节假日后一天
function getRushInfo(
  date: string,
  fromStation: string,
  toStation: string,
  holidays: Record<string, string>,
): { isRush: boolean; rushText?: string } {
  const isDepart = fromStation.includes('张家口') && !toStation.includes('张家口');
  const isReturn = !fromStation.includes('张家口') && toStation.includes('张家口');
  const current = new Date(date + 'T00:00:00');

  for (const [holidayDate, name] of Object.entries(holidays)) {
    const hd = new Date(holidayDate + 'T00:00:00');

    if (isReturn) {
      // 返程 target：节假日前一天
      const target = new Date(hd);
      target.setDate(target.getDate() - 1);
      const diffDays = (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 15) {
        return { isRush: true, rushText: `${name}抢票` };
      }
    }

    if (isDepart) {
      // 去程 target：节假日后一天
      const target = new Date(hd);
      target.setDate(target.getDate() + 1);
      const diffDays = (target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 15) {
        return { isRush: true, rushText: `${name}抢票` };
      }
    }
  }

  return { isRush: false };
}

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [tickets, setTickets] = useState<TicketGroup[]>([]);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [hideHolidays, setHideHolidays] = useState(false);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'config'>('tickets');
  const [newTrain, setNewTrain] = useState({ trainNo: '', fromStation: '', toStation: '', seatTypes: ['ze'] });

  const fetchData = useCallback(async () => {
    try {
      const [configRes, ticketsRes, schedulerRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/tickets'),
        fetch('/api/scheduler'),
      ]);
      const configData = await configRes.json();
      const ticketsData = await ticketsRes.json();
      const schedulerData = await schedulerRes.json();
      setConfig(configData);
      setTickets(ticketsData.tickets);
      setHolidays(ticketsData.holidays || {});
      if (ticketsData.config?.hideHolidays !== undefined) {
        setHideHolidays(ticketsData.config.hideHolidays);
      }
      if (ticketsData.config?.hideWeekends !== undefined) {
        setHideWeekends(ticketsData.config.hideWeekends);
      }
      setSchedulerRunning(schedulerData.running);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const addTrain = async () => {
    if (!newTrain.trainNo || !newTrain.fromStation || !newTrain.toStation) return;
    await fetch('/api/trains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTrain),
    });
    setNewTrain({ trainNo: '', fromStation: '', toStation: '', seatTypes: ['ze'] });
    fetchData();
  };

  const deleteTrain = async (id: string) => {
    await fetch(`/api/trains/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const markBought = async (trainNo: string, date: string, seatType?: string) => {
    await fetch('/api/bought', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainNo, date, seatType }),
    });
    fetchData();
  };

  const unmarkBought = async (trainNo: string, date: string) => {
    await fetch(`/api/bought/${trainNo}/${date}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleBought = (trainNo: string, date: string, isBought: boolean, defaultSeat?: string) => {
    if (isBought) {
      unmarkBought(trainNo, date);
    } else {
      markBought(trainNo, date, defaultSeat);
    }
  };

  const toggleScheduler = async () => {
    if (schedulerRunning) {
      await fetch('/api/scheduler/stop', { method: 'POST' });
    } else {
      await fetch('/api/scheduler/start', { method: 'POST' });
    }
    fetchData();
  };

  // Generate date range
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < (config?.daysAhead || 15); i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const trains = config?.trains.filter(t => t.enabled) || [];

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🚄 Rail Watch</h1>
          <button
            onClick={() => setActiveTab(activeTab === 'tickets' ? 'config' : 'tickets')}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            {activeTab === 'tickets' ? '⚙️ 配置管理' : '← 返回余票'}
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div>
            {trains.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p>暂无监听车次</p>
                <p className="text-sm mt-2">请到「配置管理」添加车次</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideHolidays}
                      onChange={async (e) => {
                        const checked = e.target.checked;
                        setHideHolidays(checked);
                        await fetch('/api/config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ hideHolidays: checked }),
                        });
                        await fetchData();
                      }}
                      className="rounded"
                    />
                    隐藏法定节假日
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideWeekends}
                      onChange={async (e) => {
                        const checked = e.target.checked;
                        setHideWeekends(checked);
                        await fetch('/api/config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ hideWeekends: checked }),
                        });
                        await fetchData();
                      }}
                      className="rounded"
                    />
                    隐藏周六日
                  </label>
                  {Object.keys(holidays).length > 0 && (
                    <span className="text-xs text-gray-400">
                      本期包含 {Object.keys(holidays).length} 天节假日
                    </span>
                  )}
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-3 py-3 text-gray-500 font-medium whitespace-nowrap sticky left-0 bg-gray-50 z-10 border-r border-gray-200 w-24">
                          日期
                        </th>
                        {trains.map(train => (
                          <th
                            key={train.id}
                            className="text-center px-2 py-3 text-gray-700 font-medium min-w-[100px]"
                          >
                            <div className="font-bold text-gray-900">{train.trainNo}</div>
                            <div className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">
                              {train.fromStation} → {train.toStation}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dates.filter(date => {
                        const hasBoughtOnDate = trains.some(train => {
                          const t = tickets.find(x => x.trainNo === train.trainNo && x.date === date);
                          return t?.bought;
                        });
                        if (hideHolidays && holidays[date] && !hasBoughtOnDate) return false;
                        if (hideWeekends) {
                          const d = new Date(date + 'T00:00:00');
                          const day = d.getDay();
                          if ((day === 0 || day === 6) && !hasBoughtOnDate) return false;
                        }
                        return true;
                      }).map(date => (
                        <tr key={date} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-3 whitespace-nowrap text-gray-700 font-medium sticky left-0 bg-white border-r border-gray-200 z-10 w-24">
                            <div>{formatDate(date)}</div>
                            {holidays[date] && (
                              <div className="text-xs text-orange-500 mt-0.5">{holidays[date]}</div>
                            )}
                          </td>
                          {trains.map(train => {
                            const ticket = tickets.find(t => t.trainNo === train.trainNo && t.date === date);
                            const isBought = ticket?.bought || false;
                            const defaultSeat = train.seatTypes[0];
                            const st = train.seatTypes[0];
                            const seat = ticket?.seats[st];
                            const disp = seatDisplay(seat?.available);
                            const isLow = typeof seat?.available === 'number' && seat.available > 0 && seat.available <= 5;
                            const rush = getRushInfo(date, train.fromStation, train.toStation, holidays);
                            const cellBg = isBought ? 'bg-green-50' : rush.isRush ? 'bg-red-50' : isLow ? 'bg-orange-50' : '';
                            const qt = ticket?.seats[st]?.queryTime;
                            const timeStr = qt ? `采集于 ${formatTime(qt)}` : '尚未采集';
                            const title = isBought ? `双击取消已购 | ${timeStr}` : `双击标记已购 | ${timeStr}`;

                            return (
                              <td
                                key={train.id}
                                className={`px-2 py-3 text-center align-middle cursor-pointer select-none ${cellBg}`}
                                onDoubleClick={() => toggleBought(train.trainNo, date, isBought, defaultSeat)}
                                title={title}
                              >
                                {(() => {
                                  const timeSmall = qt ? <div className="text-[10px] text-gray-300 mt-0.5">{formatTime(qt)}</div> : null;
                                  if (isBought) {
                                    return (
                                      <div className="flex flex-col items-center">
                                        <div className="text-green-600 font-medium">✓ 已购</div>
                                        {timeSmall}
                                      </div>
                                    );
                                  }
                                  if (rush.isRush) {
                                    return (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <div className={`text-base ${isLow ? 'text-orange-600 font-bold' : disp.color}`}>{disp.text}</div>
                                        <div className="text-xs text-red-500 font-medium whitespace-nowrap">{rush.rushText}</div>
                                        {timeSmall}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="flex flex-col items-center">
                                      <div className={`text-base ${isLow ? 'text-orange-600 font-bold' : disp.color}`}>
                                        {disp.text}
                                      </div>
                                      {timeSmall}
                                    </div>
                                  );
                                })()}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Add Train */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">添加监听车次</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="车次号 (如 G1234)"
                  value={newTrain.trainNo}
                  onChange={e => setNewTrain({ ...newTrain, trainNo: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="出发站 (如 张家口)"
                  value={newTrain.fromStation}
                  onChange={e => setNewTrain({ ...newTrain, fromStation: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="到达站 (如 北京北)"
                  value={newTrain.toStation}
                  onChange={e => setNewTrain({ ...newTrain, toStation: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addTrain}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SEAT_OPTIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-1 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTrain.seatTypes.includes(key)}
                      onChange={e => {
                        if (e.target.checked) {
                          setNewTrain({ ...newTrain, seatTypes: [...newTrain.seatTypes, key] });
                        } else {
                          setNewTrain({ ...newTrain, seatTypes: newTrain.seatTypes.filter(s => s !== key) });
                        }
                      }}
                      className="rounded"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Train List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">监听列表</h2>
              </div>
              {config?.trains.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">暂无车次</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {config?.trains.map(train => (
                    <div key={train.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{train.trainNo}</span>
                        <span className="text-sm text-gray-500 ml-2">{train.fromStation} → {train.toStation}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {train.seatTypes.map(s => SEAT_LABELS[s]).join('、')}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTrain(train.id)}
                        className="text-sm px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">全局设置</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-gray-600 mb-1">监控天数</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={config?.daysAhead || 15}
                    onChange={async e => {
                      const days = parseInt(e.target.value) || 15;
                      await fetch('/api/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ daysAhead: days }),
                      });
                      fetchData();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">轮询间隔（分钟）</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={config?.intervalMinutes || 5}
                    onChange={async e => {
                      const mins = parseInt(e.target.value) || 5;
                      await fetch('/api/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ intervalMinutes: mins }),
                      });
                      fetchData();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
