'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUserStore } from '@/stores/userStore';
import * as db from '@/lib/db/queries';
import type { PomodoroState } from '@/lib/types';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PomodoroTimer({ compact = false }: { compact?: boolean }) {
  const { pomodoro } = useSettingsStore();
  const { addXP } = useUserStore();

  const [state, setState] = useState<PomodoroState>('idle');
  const [timeLeft, setTimeLeft] = useState(pomodoro.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getDuration = useCallback(
    (s: PomodoroState) => {
      switch (s) {
        case 'focus':
          return pomodoro.focusDuration * 60;
        case 'break':
          return pomodoro.breakDuration * 60;
        case 'long_break':
          return pomodoro.longBreakDuration * 60;
        default:
          return pomodoro.focusDuration * 60;
      }
    },
    [pomodoro]
  );

  // Load today's sessions
  useEffect(() => {
    db.getTodayPomodoroSessions().then((sessions) => {
      setSessionsCompleted(sessions.filter(s => s.type === 'focus' && s.completedAt).length);
    }).catch(() => {});
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleSessionEnd().catch(() => {});
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  // Visibility change — keep timer accurate
  useEffect(() => {
    let hiddenAt: number | null = null;

    const handleVisibility = () => {
      if (document.hidden && isRunning) {
        hiddenAt = Date.now();
      } else if (!document.hidden && hiddenAt && isRunning) {
        const elapsed = Math.floor((Date.now() - hiddenAt) / 1000);
        setTimeLeft((t) => Math.max(0, t - elapsed));
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning]);

  const handleSessionEnd = async () => {
    try {
      setIsRunning(false);

      if (state === 'focus') {
        const newCount = sessionsCompleted + 1;
        setSessionsCompleted(newCount);

        // Registrar sessão
        await db.addPomodoroSession({
          startedAt: new Date(Date.now() - pomodoro.focusDuration * 60000).toISOString(),
          completedAt: new Date().toISOString(),
          duration: pomodoro.focusDuration,
          type: 'focus',
        });

        // XP por sessão completada
        addXP(15, 'focus');

        // Atualizar daily log
        const today = new Date().toISOString().split('T')[0];
        const log = await db.getDailyLog(today);
        await db.upsertDailyLog(today, {
          pomodoroSessions: (log?.pomodoroSessions || 0) + 1,
          xpEarned: (log?.xpEarned || 0) + 15,
        });

        // Próximo: break ou long break
        if (newCount % pomodoro.sessionsUntilLongBreak === 0) {
          setState('long_break');
          setTimeLeft(pomodoro.longBreakDuration * 60);
        } else {
          setState('break');
          setTimeLeft(pomodoro.breakDuration * 60);
        }

        // Notificação
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('⚔️ Sessão concluída!', {
            body: `+15 XP de Foco. ${newCount} sessões hoje.`,
          });
        }
      } else {
        // Break terminou
        setState('focus');
        setTimeLeft(pomodoro.focusDuration * 60);
      }
    } catch {
      // DB error — timer state already updated, just skip persistence
    }
  };

  const startTimer = () => {
    if (state === 'idle') setState('focus');
    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    setState('idle');
    setTimeLeft(pomodoro.focusDuration * 60);
  };

  const skipPhase = () => {
    setIsRunning(false);
    handleSessionEnd();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalDuration = getDuration(state === 'idle' ? 'focus' : state);
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  const stateConfig = {
    idle: { label: 'Pronto para focar', color: 'accent-purple', icon: Flame },
    focus: { label: 'Foco', color: 'accent-red', icon: Flame },
    break: { label: 'Pausa', color: 'accent-green', icon: Coffee },
    long_break: { label: 'Pausa Longa', color: 'accent-blue', icon: Coffee },
  };

  const currentConfig = stateConfig[state];

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-bg-card border border-border p-3">
        <currentConfig.icon size={16} className={`text-${currentConfig.color}`} />
        <span className="font-mono text-lg font-bold text-text-primary">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="text-xs text-text-dim">{currentConfig.label}</span>
        <div className="ml-auto flex gap-1">
          {!isRunning ? (
            <button onClick={startTimer} className="rounded-lg bg-accent-purple/20 p-1.5 text-accent-purple-light">
              <Play size={14} />
            </button>
          ) : (
            <button onClick={pauseTimer} className="rounded-lg bg-accent-yellow/20 p-1.5 text-accent-yellow">
              <Pause size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-bg-card border border-border p-6 text-center space-y-6">
      {/* Circle Timer */}
      <div className="relative mx-auto h-48 w-48">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth="4"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`var(--${currentConfig.color})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-4xl font-bold text-text-primary">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className={`mt-1 text-xs font-medium text-${currentConfig.color}`}>
            {currentConfig.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={resetTimer}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-tertiary text-text-dim hover:text-text-primary transition-colors"
        >
          <RotateCcw size={18} />
        </button>

        {!isRunning ? (
          <button
            onClick={startTimer}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-purple text-white shadow-lg shadow-accent-purple/30 hover:bg-accent-purple-dark transition-all"
          >
            <Play size={24} className="ml-0.5" />
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-yellow text-bg-primary shadow-lg shadow-accent-yellow/30 hover:bg-accent-yellow/80 transition-all"
          >
            <Pause size={24} />
          </button>
        )}

        <button
          onClick={skipPhase}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-tertiary text-text-dim hover:text-text-primary transition-colors"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Sessions count */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: pomodoro.sessionsUntilLongBreak }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i < sessionsCompleted % pomodoro.sessionsUntilLongBreak
                ? 'bg-accent-purple'
                : 'bg-bg-tertiary'
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-text-dim">
          {sessionsCompleted} sessões hoje
        </span>
      </div>
    </div>
  );
}
