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
 * page navigations. This prevents the header/nav/SoundProvider from being
 * torn down and rebuilt every time the user switches tabs.
 *
 * CRITICAL: {children} must always be rendered at the same structural
 * position in the JSX tree. If {children} moves between different container
 * elements when state changes (hideAppShell, isSettings), React treats them
 * as different component instances and unmounts/remounts the page — resetting
 * all local state (e.g. activeChannel in chat page).
 *
 * Visibility rules:
 *  - /onboarding, /  → public pages, minimal wrapper (different routes anyway)
 *  - /settings       → header + nav hidden; page has its own back-button header
 *  - hideAppShell=true (set by chat page when a channel is open) → shell hidden
 *  - everything else → full shell
 */
export default function PersistentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideAppShell = useUIStore((s) => s.hideAppShell);

  const isPublic = pathname === '/' || pathname?.startsWith('/onboarding');
  const isSettings = pathname?.startsWith('/settings');

  // Public pages are different routes entirely — remounting is fine here
  if (isPublic) {
    return <SoundProvider>{children}</SoundProvider>;
  }

  // For all authenticated pages, always render {children} inside the same
  // <main> element so React never remounts the page on shell state changes.
  const showHeader = !isSettings && !hideAppShell;
  const showNav = !isSettings && !hideAppShell;

  return (
    <SoundProvider>
      <div className="min-h-dvh bg-bg-primary">
        {showHeader && <Header />}
        <main className={showNav ? 'mx-auto max-w-lg pb-safe' : 'min-h-dvh'}>
          {children}
        </main>
        {showNav && <BottomNav />}
        {showNav && <FloatingPomodoroTimer />}
        {showNav && <AIAssistantFAB />}
      </div>
    </SoundProvider>
  );
}
