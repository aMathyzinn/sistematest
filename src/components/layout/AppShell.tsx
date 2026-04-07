'use client';

import Header from './Header';
import BottomNav from './BottomNav';
import SoundProvider from '@/components/SoundProvider';
import AIAssistantFAB from '@/components/ui/AIAssistantFAB';
import FloatingPomodoroTimer from '@/components/pomodoro/FloatingPomodoroTimer';

interface AppShellProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
}

export default function AppShell({ children, showHeader = true, showNav = true }: AppShellProps) {
  return (
    <SoundProvider>
      <div className="h-full flex flex-col bg-bg-primary">
        {showHeader && <Header />}
        <main className={`flex-1 overflow-y-auto ${showNav ? 'pb-safe' : ''}`}>
          {children}
        </main>
        {showNav && <BottomNav />}
        {showNav && <FloatingPomodoroTimer />}
        {showNav && <AIAssistantFAB />}
      </div>
    </SoundProvider>
  );
}
