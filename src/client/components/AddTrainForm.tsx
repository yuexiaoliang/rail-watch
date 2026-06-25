import { memo, useState, useCallback } from 'react';
import { SEAT_OPTIONS, DIRECTION_LABELS } from '../../shared/types.js';
import { api } from '../api.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Checkbox } from '../components/ui/checkbox.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import type { TrainDirection } from '../../shared/types.js';

interface AddTrainFormProps {
  onAdded: () => void;
}

export const AddTrainForm = memo(function AddTrainForm({ onAdded }: AddTrainFormProps) {
  const [newTrain, setNewTrain] = useState({
    trainNo: '',
    fromStation: '',
    toStation: '',
    seatTypes: ['ze'] as string[],
    direction: undefined as TrainDirection | undefined,
  });

  const handleAdd = useCallback(async () => {
    if (!newTrain.trainNo || !newTrain.fromStation || !newTrain.toStation) return;
    await api.addTrain(newTrain);
    setNewTrain({ trainNo: '', fromStation: '', toStation: '', seatTypes: ['ze'], direction: undefined });
    onAdded();
  }, [newTrain, onAdded]);

  const toggleSeatType = useCallback((key: string, checked: boolean) => {
    setNewTrain((prev) => {
      if (checked) {
        return { ...prev, seatTypes: [...prev.seatTypes, key] };
      }
      return { ...prev, seatTypes: prev.seatTypes.filter((s) => s !== key) };
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加监听车次</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="车次号 (如 G1234)"
            value={newTrain.trainNo}
            onChange={(e) => setNewTrain((prev) => ({ ...prev, trainNo: e.target.value }))}
          />
          <Input
            placeholder="出发站 (如 张家口)"
            value={newTrain.fromStation}
            onChange={(e) => setNewTrain((prev) => ({ ...prev, fromStation: e.target.value }))}
          />
          <Input
            placeholder="到达站 (如 北京北)"
            value={newTrain.toStation}
            onChange={(e) => setNewTrain((prev) => ({ ...prev, toStation: e.target.value }))}
          />
          <Button onClick={handleAdd}>添加</Button>
        </div>
        <div className="flex flex-wrap gap-4">
          {SEAT_OPTIONS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`seat-${key}`}
                checked={newTrain.seatTypes.includes(key)}
                onCheckedChange={(checked) => toggleSeatType(key, checked === true)}
              />
              <label htmlFor={`seat-${key}`} className="text-sm cursor-pointer">
                {label}
              </label>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">方向</span>
          <Button
            type="button"
            variant={newTrain.direction === 'outbound' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setNewTrain((prev) => ({ ...prev, direction: 'outbound' }))}
          >
            {DIRECTION_LABELS.outbound}
          </Button>
          <Button
            type="button"
            variant={newTrain.direction === 'return' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setNewTrain((prev) => ({ ...prev, direction: 'return' }))}
          >
            {DIRECTION_LABELS.return}
          </Button>
          <Button
            type="button"
            variant={newTrain.direction === undefined ? 'default' : 'outline'}
            size="xs"
            onClick={() => setNewTrain((prev) => ({ ...prev, direction: undefined }))}
          >
            不标
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
