import { memo } from 'react';
import { Button } from '../components/ui/button.js';

interface HeaderProps {
  activeTab: 'tickets' | 'config';
  onToggleTab: () => void;
}

export const Header = memo(function Header({ activeTab, onToggleTab }: HeaderProps) {
  return (
    <header className="bg-background border-b">
      <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🚄 Rail Watch</h1>
        <Button variant="outline" size="sm" onClick={onToggleTab}>
          {activeTab === 'tickets' ? '⚙️ 配置管理' : '← 返回余票'}
        </Button>
      </div>
    </header>
  );
});
