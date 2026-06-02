import { memo, useCallback } from 'react';
import { api } from '../api.js';
import { Input } from '../components/ui/input.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';

interface SettingsPanelProps {
  daysAhead: number;
  intervalMinutes: number;
  onUpdated: () => void;
}

export const SettingsPanel = memo(function SettingsPanel({
  daysAhead,
  intervalMinutes,
  onUpdated,
}: SettingsPanelProps) {
  const handleDaysChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = parseInt(e.target.value) || 15;
    await api.updateConfig({ daysAhead: days });
    onUpdated();
  }, [onUpdated]);

  const handleIntervalChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const mins = parseInt(e.target.value) || 5;
    await api.updateConfig({ intervalMinutes: mins });
    onUpdated();
  }, [onUpdated]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>全局设置</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">监控天数</label>
            <Input
              type="number"
              min={1}
              max={30}
              value={daysAhead}
              onChange={handleDaysChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">轮询间隔（分钟）</label>
            <Input
              type="number"
              min={1}
              max={60}
              value={intervalMinutes}
              onChange={handleIntervalChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
