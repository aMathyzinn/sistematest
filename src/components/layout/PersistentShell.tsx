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
 * Visibility rules:
 *  - /onboarding, /  → no shell at all (public pages)
 *  - /settings       → header hidden, nav hidden (page has its own back-button header)
 *  - hideAppShell=true (set by chat page when a channel is open) → shell hidden
 *  - everything else → full shell
 */
export default function PersistentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideAppShell = useUIStore((s) => s.hideAppShell);

  const isPublic = pathname === '/' || pathname?.startsWith('/onboarding');
  const isSettings = pathname?.startsWith('/settings');

  // Full-screen takeover (chat channel view)
  if (hideAppShell) {
    return (
      <SoundProvider>
        <div className="min-h-dvh bg-bg-primary">{children}</div>
      </SoundProvider>
    );
  }

  // Public pages with no shell
  if (isPublic) {
    return <SoundProvider>{children}</SoundProvider>;
  }

  // Settings: shell hidden, no nav, no app header
  // The settings page renders its own back-button header inside its content
  if (isSettings) {
    return (
      <SoundProvider>
        <div className="min-h-dvh bg-bg-primary">
          <main className="mx-auto max-w-lg">
            {children}
          </main>
        </div>
      </SoundProvider>
    );
  }

  // Normal app pages — full persistent shell
  return (
    <SoundProvider>
      <div className="min-h-dvh bg-bg-primary">
        <Header />
        <main className="mx-auto max-w-lg pb-safe">
          {children}
        </main>
        <BottomNav />
        <FloatingPomodoroTimer />
        <AIAssistantFAB />
      </div>
    </SoundProvider>
  );
}
