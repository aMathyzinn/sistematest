'use client';

import DashboardGrid from '@/components/dashboard/DashboardGrid';
import TutorialOverlay from '@/components/ui/TutorialOverlay';
import { useSettingsStore } from '@/stores/settingsStore';

export default function DashboardPage() {
  const { hasSeenTutorial, setHasSeenTutorial } = useSettingsStore();

  return (
    <>
      <DashboardGrid />
      {!hasSeenTutorial && (
        <TutorialOverlay onComplete={() => setHasSeenTutorial(true)} />
      )}
    </>
  );
}
