'use client';

import Header from './Header';
import BottomNav from './BottomNav';
import SoundProvider from '@/components/SoundProvider';

interface AppShellProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
}

export default function AppShell({ children, showHeader = true, showNav = true }: AppShellProps) {
  return (
    <SoundProvider>
      <div className="min-h-dvh bg-bg-primary">
        {showHeader && <Header />}
        <main className={`mx-auto max-w-lg ${showNav ? 'pb-safe' : ''}`}>
          {children}
        </main>
        {showNav && <BottomNav />}
      </div>
    </SoundProvider>
  );
}
