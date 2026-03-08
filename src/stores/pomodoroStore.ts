import { create } from 'zustand';
import type { PomodoroState } from '@/lib/types';

// Timer is stored as a snapshot + timestamp so the component can remount
// (navigate away and back) without losing the running timer.
//
// When running:
//   real timeLeft = snapshotTimeLeft - floor((now - startedAt) / 1000)
// When paused / idle:
//   real timeLeft = snapshotTimeLeft (startedAt is null)

interface PomodoroStore {
  phase: PomodoroState;
  isRunning: boolean;
  startedAt: number | null;      // Date.now() when last started/resumed
  snapshotTimeLeft: number;      // seconds remaining at last start/resume/pause
  sessionsCompleted: number;

  getTimeLeft: () => number;
  startSession: (focusDurationSeconds: number) => void;
  resume: () => void;
  pause: () => void;
  reset: (focusDurationSeconds: number) => void;
  setPhase: (phase: PomodoroState, durationSeconds: number) => void;
  setSessionsCompleted: (n: number) => void;
  syncIdleDuration: (focusDurationSeconds: number) => void;
}

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  phase: 'idle',
  isRunning: false,
  startedAt: null,
  snapshotTimeLeft: 25 * 60,
  sessionsCompleted: 0,

  getTimeLeft: () => {
    const { isRunning, startedAt, snapshotTimeLeft } = get();
    if (!isRunning || startedAt === null) return snapshotTimeLeft;
    return Math.max(0, snapshotTimeLeft - Math.floor((Date.now() - startedAt) / 1000));
  },

  startSession: (focusDurationSeconds: number) =>
    set({ phase: 'focus', isRunning: true, startedAt: Date.now(), snapshotTimeLeft: focusDurationSeconds }),

  resume: () => {
    const timeLeft = get().getTimeLeft();
    set({ isRunning: true, startedAt: Date.now(), snapshotTimeLeft: timeLeft });
  },

  pause: () => {
    const timeLeft = get().getTimeLeft();
    set({ isRunning: false, startedAt: null, snapshotTimeLeft: timeLeft });
  },

  reset: (focusDurationSeconds: number) =>
    set({ phase: 'idle', isRunning: false, startedAt: null, snapshotTimeLeft: focusDurationSeconds }),

  setPhase: (phase: PomodoroState, durationSeconds: number) =>
    set({ phase, isRunning: false, startedAt: null, snapshotTimeLeft: durationSeconds }),

  setSessionsCompleted: (n: number) => set({ sessionsCompleted: n }),

  // Called on mount when phase is idle to keep the display in sync with settings
  syncIdleDuration: (focusDurationSeconds: number) => {
    if (get().phase === 'idle') {
      set({ snapshotTimeLeft: focusDurationSeconds });
    }
  },
}));
