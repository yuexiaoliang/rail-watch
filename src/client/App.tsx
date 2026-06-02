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
import { Badge } from './components/ui/badge.js';
import type { AppConfig, TicketGroup } from '../shared/types.js';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [tickets, setTickets] = useState<TicketGroup[]>([]);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [hideHolidays, setHideHolidays] = useState(false);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'config'>('tickets');

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

  const handleToggleBought = useCallback(
    async (trainNo: string, date: string, isBought: boolean, defaultSeat?: string) => {
      if (isBought) {
        await api.unmarkBought(trainNo, date);
      } else {
        await api.markBought(trainNo, date, defaultSeat);
      }
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
      <Header activeTab={activeTab} onToggleTab={handleToggleTab} />

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
                <div className="flex items-center gap-4">
                  <Badge
                    variant={schedulerRunning ? 'default' : 'secondary'}
                    className={
                      schedulerRunning ? 'bg-green-600 hover:bg-green-700' : ''
                    }
                  >
                    调度器: {schedulerRunning ? '运行中' : '已停止'}
                  </Badge>
                </div>
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
                  onToggleBought={handleToggleBought}
                />
              </>
            )}
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
