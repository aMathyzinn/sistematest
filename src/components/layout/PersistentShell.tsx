'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import BottomNav from './BottomNav';
import SoundProvider from '@/components/SoundProvider';
import AIAssistantFAB from '@/components/ui/AIAssistantFAB';
import FloatingPomodoroTimer from '@/components/pomodoro/FloatingPomodoroTimer';
import { useUIStore } from '@/stores/uiStore';

/**
 * Persistent shell that lives in root layout.tsx and NEVER unmounts between
 * page navigations. Now contained inside PhoneFrame's .phone-app-area.
 *
 * The phone frame provides StatusBar above and SystemNavBar below, so
 * this shell manages only the app's own chrome (Header, BottomNav, FAB, etc).
 *
 * Scrolling happens inside the <main> element, not the body. This keeps
 * the header non-scrolling and the bottom nav always visible.
 */
export default function PersistentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideAppShell = useUIStore((s) => s.hideAppShell);

  const isPublic = pathname === '/' || pathname?.startsWith('/onboarding');
  const isSettings = pathname?.startsWith('/settings');

  if (isPublic) {
    return (
      <SoundProvider>
        <div className="h-full flex flex-col overflow-y-auto bg-bg-primary">
          {children}
        </div>
      </SoundProvider>
    );
  }

  const showHeader = !isSettings && !hideAppShell;
  const showNav = !isSettings && !hideAppShell;

  return (
    <SoundProvider>
      <div className="h-full flex flex-col bg-bg-primary relative">
        {showHeader && <Header />}
        <main className={`flex-1 overflow-y-auto min-h-0 ${showNav ? 'pb-safe' : ''}`}>
          {children}
        </main>
        {showNav && <BottomNav />}
        {showNav && <FloatingPomodoroTimer />}
        {showNav && <AIAssistantFAB />}
      </div>
    </SoundProvider>
  );
}
