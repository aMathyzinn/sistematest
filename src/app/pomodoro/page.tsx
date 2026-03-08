'use client';

import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';

export default function PomodoroPage() {
  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold text-text-primary">Pomodoro</h2>
      <PomodoroTimer />
    </div>
  );
}
