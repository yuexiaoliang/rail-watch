import { memo } from 'react';
import { Train, CalendarDays, Settings } from 'lucide-react';
import { Button } from '../components/ui/button.js';

interface HeaderProps {
  activeTab: 'tickets' | 'calendar' | 'config';
  onTabChange: (tab: 'tickets' | 'calendar' | 'config') => void;
  schedulerRunning?: boolean;
}

const TABS: { key: 'tickets' | 'calendar' | 'config'; label: string; icon: React.ReactNode }[] = [
  { key: 'tickets', label: '余票', icon: <Train className="w-4 h-4" /> },
  { key: 'calendar', label: '日历', icon: <CalendarDays className="w-4 h-4" /> },
  { key: 'config', label: '配置', icon: <Settings className="w-4 h-4" /> },
];

export const Header = memo(function Header({ activeTab, onTabChange, schedulerRunning }: HeaderProps) {
  return (
    <header className="bg-background border-b">
      <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Train className="w-6 h-6" />
          Rail Watch
        </h1>

        {/* 标签导航 */}
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* 调度器状态 */}
          <div
            className={`w-3 h-3 rounded-full ${
              schedulerRunning ? 'bg-green-500' : 'bg-gray-300'
            }`}
            title={schedulerRunning ? '调度器运行中' : '调度器已停止'}
          />
        </div>
      </div>
    </header>
  );
});
