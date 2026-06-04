import { memo } from 'react';
import { Train, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button.js';

interface HeaderProps {
  activeTab: 'tickets' | 'config';
  onToggleTab: () => void;
  schedulerRunning?: boolean;
}

export const Header = memo(function Header({ activeTab, onToggleTab, schedulerRunning }: HeaderProps) {
  return (
    <header className="bg-background border-b">
      <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Train className="w-6 h-6" />
          Rail Watch
        </h1>
        <div className="flex items-center gap-3">
          {/* 调度器状态 */}
          <div
            className={`w-3 h-3 rounded-full ${
              schedulerRunning ? 'bg-green-500' : 'bg-gray-300'
            }`}
            title={schedulerRunning ? '调度器运行中' : '调度器已停止'}
          />
          <Button variant="outline" size="icon" onClick={onToggleTab}>
            {activeTab === 'tickets' ? (
              <Settings className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
});
