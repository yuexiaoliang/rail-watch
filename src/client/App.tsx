import { useState, useEffect, useCallback } from 'react';
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
  const [activeTab, setActiveTab] = useState<'tickets' | 'calendar' | 'config'>('tickets');

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

  const handleTabChange = useCallback((tab: 'tickets' | 'calendar' | 'config') => {
    setActiveTab(tab);
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
      <Header activeTab={activeTab} onTabChange={handleTabChange} schedulerRunning={schedulerRunning} />

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
        )}

        {activeTab === 'calendar' && <CalendarView />}

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
