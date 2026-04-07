'use client';

import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';

export default function PomodoroPage() {
  return (
    <div className="px-4 py-3 space-y-3">
      <h2 className="text-base font-bold text-text-primary">Pomodoro</h2>
      <PomodoroTimer />
    </div>
  );
}
