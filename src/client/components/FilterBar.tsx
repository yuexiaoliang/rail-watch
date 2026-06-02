import { memo, useCallback } from 'react';
import { api } from '../api.js';
import { Switch } from '../components/ui/switch.js';

interface FilterBarProps {
  hideHolidays: boolean;
  hideWeekends: boolean;
  holidaysCount: number;
  onHideHolidaysChange: (value: boolean) => void;
  onHideWeekendsChange: (value: boolean) => void;
  onRefresh: () => void;
}

export const FilterBar = memo(function FilterBar({
  hideHolidays,
  hideWeekends,
  holidaysCount,
  onHideHolidaysChange,
  onHideWeekendsChange,
  onRefresh,
}: FilterBarProps) {
  const handleHolidaysChange = useCallback(async (checked: boolean) => {
    onHideHolidaysChange(checked);
    await api.updateConfig({ hideHolidays: checked });
    onRefresh();
  }, [onHideHolidaysChange, onRefresh]);

  const handleWeekendsChange = useCallback(async (checked: boolean) => {
    onHideWeekendsChange(checked);
    await api.updateConfig({ hideWeekends: checked });
    onRefresh();
  }, [onHideWeekendsChange, onRefresh]);

  return (
    <div className="flex items-center gap-6 mb-4">
      <div className="flex items-center gap-2">
        <Switch
          id="hide-holidays"
          checked={hideHolidays}
          onCheckedChange={handleHolidaysChange}
        />
        <label htmlFor="hide-holidays" className="text-sm text-muted-foreground cursor-pointer">
          隐藏法定节假日
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="hide-weekends"
          checked={hideWeekends}
          onCheckedChange={handleWeekendsChange}
        />
        <label htmlFor="hide-weekends" className="text-sm text-muted-foreground cursor-pointer">
          隐藏周六日
        </label>
      </div>
      {holidaysCount > 0 && (
        <span className="text-xs text-muted-foreground">
          本期包含 {holidaysCount} 天节假日
        </span>
      )}
    </div>
  );
});
