import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api.js';
import {
  Header,
  TicketsTable,
  FilterBar,
  AddTrainForm,
  TrainList,
  SettingsPanel,
  CalendarView,
} from './components/index.js';
import { generateDates } from '../shared/utils.js';
import type { AppConfig, TicketGroup, CellStatus } from '../shared/types.js';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [tickets, setTickets] = useState<TicketGroup[]>([]);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [hideHolidays, setHideHolidays] = useState(false);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'config'>('tickets');
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [configData, ticketsData, schedulerData] = await Promise.all([
        api.getConfig(),
        api.getTickets(),
        api.getSchedulerStatus(),
      ]);
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

  const handleToggleTab = useCallback(() => {
    setActiveTab((tab) => (tab === 'tickets' ? 'config' : 'tickets'));
  }, []);

  // 点击日历日期，滚动到表格对应行
  const handleDateClick = useCallback((date: string) => {
    const row = document.querySelector(`[data-date="${date}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 高亮一下
      row.classList.add('bg-yellow-50');
      setTimeout(() => row.classList.remove('bg-yellow-50'), 1500);
    }
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
          <div className="flex gap-6">
            {/* 左侧日历 */}
            <CalendarView onDateClick={handleDateClick} />

            {/* 右侧余票表格 */}
            <div className="flex-1 min-w-0 space-y-4" ref={tableRef}>
              {trains.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <p>暂无监听车次</p>
                  <p className="text-sm mt-2">请到「配置管理」添加车次</p>
                </div>
              ) : (
                <>
                  <FilterBar
                    hideHolidays={hideHolidays}
                    hideWeekends={hideWeekends}
                    holidaysCount={Object.keys(holidays).length}
                    onHideHolidaysChange={setHideHolidays}
                    onHideWeekendsChange={setHideWeekends}
                    onRefresh={fetchData}
                  />
                  <TicketsTable
                    trains={trains}
                    tickets={tickets}
                    dates={dates}
                    holidays={holidays}
                    hideHolidays={hideHolidays}
                    hideWeekends={hideWeekends}
                    onSetCellStatus={handleSetCellStatus}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <AddTrainForm onAdded={fetchData} />
            <TrainList trains={config?.trains || []} onDeleted={fetchData} />
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
