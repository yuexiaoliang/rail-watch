import { memo, useCallback, useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { SEAT_LABELS, DIRECTION_LABELS } from '../../shared/types.js';
import { api } from '../api.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import type { TrainConfig, TrainDirection } from '../../shared/types.js';

interface TrainListProps {
  trains: TrainConfig[];
  onDeleted: () => void;
  onReordered?: (trains: TrainConfig[]) => void;
  onUpdated?: (trains: TrainConfig[]) => void;
}

export const TrainList = memo(function TrainList({ trains, onDeleted, onReordered, onUpdated }: TrainListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDelete = useCallback(async (id: string) => {
    await api.deleteTrain(id);
    onDeleted();
  }, [onDeleted]);

  const moveTrain = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= trains.length) return;
    const reordered = [...trains];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReordered?.(reordered);
  }, [trains, onReordered]);

  const setDirection = useCallback((id: string, direction: TrainDirection | undefined) => {
    const updated = trains.map((t) => (t.id === id ? { ...t, direction } : t));
    onUpdated?.(updated);
  }, [trains, onUpdated]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) {
      e.preventDefault();
      return;
    }
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    if (id === draggingId) return;
    setDragOverId(id);
  }, [draggingId]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const sourceIndex = trains.findIndex((t) => t.id === sourceId);
    const targetIndex = trains.findIndex((t) => t.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    moveTrain(sourceIndex, targetIndex);
    setDraggingId(null);
    setDragOverId(null);
  }, [trains, moveTrain]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
  }, []);

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
            {trains.map((train, index) => {
              const isDragging = draggingId === train.id;
              const isDragOver = dragOverId === train.id;
              return (
                <div
                  key={train.id}
                  draggable={!!onReordered}
                  onDragStart={(e) => handleDragStart(e, train.id)}
                  onDragOver={(e) => handleDragOver(e, train.id)}
                  onDrop={(e) => handleDrop(e, train.id)}
                  onDragEnd={handleDragEnd}
                  className={[
                    'flex items-start p-3 rounded-lg border bg-background transition-all gap-3',
                    isDragging ? 'opacity-50 shadow-lg' : '',
                    isDragOver ? 'border-primary ring-1 ring-primary' : '',
                  ].join(' ')}
                >
                  {onReordered && (
                    <>
                      {/* 桌面端：拖拽手柄 */}
                      <div
                        data-drag-handle
                        className="hidden sm:flex items-center justify-center -ml-1 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
                        aria-label="拖拽排序"
                        role="button"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {/* 移动端：上下移动按钮 */}
                      <div className="flex flex-col sm:hidden -ml-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="上移"
                          disabled={index === 0}
                          onClick={() => moveTrain(index, index - 1)}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="下移"
                          disabled={index === trains.length - 1}
                          onClick={() => moveTrain(index, index + 1)}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="font-medium flex items-center gap-1.5">
                      {train.trainNo}
                      {train.direction && (
                        <Badge variant="secondary" className="text-[10px]">
                          {DIRECTION_LABELS[train.direction]}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {train.fromStation} → {train.toStation}
                    </div>
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {train.seatTypes.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">
                          {SEAT_LABELS[s]}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs text-muted-foreground">方向</span>
                      <Button
                        type="button"
                        variant={train.direction === 'outbound' ? 'default' : 'outline'}
                        size="xs"
                        onClick={() => setDirection(train.id, train.direction === 'outbound' ? undefined : 'outbound')}
                      >
                        {DIRECTION_LABELS.outbound}
                      </Button>
                      <Button
                        type="button"
                        variant={train.direction === 'return' ? 'default' : 'outline'}
                        size="xs"
                        onClick={() => setDirection(train.id, train.direction === 'return' ? undefined : 'return')}
                      >
                        {DIRECTION_LABELS.return}
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="hidden sm:inline-flex"
                    onClick={() => handleDelete(train.id)}
                  >
                    删除
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    className="sm:hidden shrink-0"
                    aria-label="删除"
                    onClick={() => handleDelete(train.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
