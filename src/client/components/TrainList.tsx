import { memo, useCallback } from 'react';
import { SEAT_LABELS } from '../../shared/types.js';
import { api } from '../api.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import type { TrainConfig } from '../../shared/types.js';

interface TrainListProps {
  trains: TrainConfig[];
  onDeleted: () => void;
}

export const TrainList = memo(function TrainList({ trains, onDeleted }: TrainListProps) {
  const handleDelete = useCallback(async (id: string) => {
    await api.deleteTrain(id);
    onDeleted();
  }, [onDeleted]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>监听列表</CardTitle>
      </CardHeader>
      <CardContent>
        {trains.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">暂无车次</div>
        ) : (
          <div className="space-y-3">
            {trains.map((train) => (
              <div
                key={train.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-background"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{train.trainNo}</span>
                  <span className="text-sm text-muted-foreground">
                    {train.fromStation} → {train.toStation}
                  </span>
                  <div className="flex gap-1">
                    {train.seatTypes.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">
                        {SEAT_LABELS[s]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(train.id)}>
                  删除
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
