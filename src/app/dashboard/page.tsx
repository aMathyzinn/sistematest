'use client';

import AppShell from '@/components/layout/AppShell';
import DashboardGrid from '@/components/dashboard/DashboardGrid';
import TutorialOverlay from '@/components/ui/TutorialOverlay';
import { useSettingsStore } from '@/stores/settingsStore';

export default function DashboardPage() {
  const { hasSeenTutorial, setHasSeenTutorial } = useSettingsStore();

  return (
    <AppShell>
      <DashboardGrid />
      {!hasSeenTutorial && (
        <TutorialOverlay onComplete={() => setHasSeenTutorial(true)} />
      )}
    </AppShell>
  );
}
