import { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import {
  Header,
  TicketsTable,
  FilterBar,
  AddTrainForm,
  TrainList,
  SettingsPanel,
} from './components/index.js';
import { generateDates } from '../shared/utils.js';
import type { AppConfig, TicketGroup, CellStatus, CalendarResult } from '../shared/types.js';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [tickets, setTickets] = useState<TicketGroup[]>([]);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [calendar, setCalendar] = useState<CalendarResult | null>(null);
  const [hideHolidays, setHideHolidays] = useState(false);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'config'>('tickets');

  const fetchData = useCallback(async () => {
    try {
      const [configData, ticketsData, schedulerData, calendarData] = await Promise.all([
        api.getConfig(),
        api.getTickets(),
        api.getSchedulerStatus(),
        api.getCalendar(),
      ]);
      setConfig(configData);
      setTickets(ticketsData.tickets);
      setHolidays(ticketsData.holidays || {});
      setCalendar(calendarData);
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

  const handleSetCellStatus = useCallback(
    async (trainNo: string, date: string, status: CellStatus, defaultSeat?: string) => {
      if (status === 'none') {
        await api.unmarkBought(trainNo, date);
      } else {
        await api.setCellStatus(trainNo, date, status, defaultSeat);
      }
      fetchData();
    },
    [fetchData]
  );

  const handleReorderTrains = useCallback(
    async (trains: AppConfig['trains']) => {
      await api.updateConfig({ trains });
      fetchData();
    },
    [fetchData]
  );

  const handleToggleTab = useCallback(() => {
    setActiveTab((tab) => (tab === 'tickets' ? 'config' : 'tickets'));
  }, []);

  const dates = config ? generateDates(config.daysAhead) : [];
  const trains = config?.trains.filter((t) => t.enabled) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        加载中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onToggleTab={handleToggleTab} schedulerRunning={schedulerRunning} />

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {trains.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p>暂无监听车次</p>
                <p className="text-sm mt-2">请到「配置管理」添加车次</p>
              </div>
            ) : (
              <>
                {/* 统计信息 */}
                {calendar && (
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      往后30天共 <strong className="text-foreground">{calendar.workdayCount}</strong> 个工作日
                    </span>
                    {calendar.holidayRanges.length > 0 && (
                      <span className="text-muted-foreground">
                        节假日：
                        {calendar.holidayRanges.map((range) => (
                          <span key={range.name} className="ml-1">
                            {range.name}
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full ml-1">
                              {range.startDate.slice(5)}~{range.endDate.slice(5)} {range.days}天
                            </span>
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                )}

                <FilterBar
                  hideHolidays={hideHolidays}
                  hideWeekends={hideWeekends}
                  onHideHolidaysChange={setHideHolidays}
                  onHideWeekendsChange={setHideWeekends}
                  onRefresh={fetchData}
                />
                <TicketsTable
                  trains={trains}
                  tickets={tickets}
                  dates={dates}
                  holidays={holidays}
                  calendarDays={calendar?.days || []}
                  hideHolidays={hideHolidays}
                  hideWeekends={hideWeekends}
                  onSetCellStatus={handleSetCellStatus}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <AddTrainForm onAdded={fetchData} />
            <TrainList trains={config?.trains || []} onDeleted={fetchData} onReordered={handleReorderTrains} />
            <SettingsPanel
              daysAhead={config?.daysAhead || 15}
              intervalMinutes={config?.intervalMinutes || 5}
              onUpdated={fetchData}
            />
          </div>
        )}
      </main>
    </div>
  );
}
