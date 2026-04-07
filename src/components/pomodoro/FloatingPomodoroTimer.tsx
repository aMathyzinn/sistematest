'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Timer } from 'lucide-react';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useSettingsStore } from '@/stores/settingsStore';

export default function FloatingPomodoroTimer() {
  const pathname = usePathname();
  const router = useRouter();
  const timer = usePomodoroStore();
  const { pomodoro } = useSettingsStore();

  // Re-render every 500 ms while running
  const [, tick] = useState(0);
  useEffect(() => {
    if (!timer.isRunning) return;
    const id = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [timer.isRunning]);

  // Only show when timer is active (running or paused but not idle)
  // and user is NOT already on the pomodoro page
  const onPomodoroPage = pathname?.startsWith('/pomodoro');
  const isActive = timer.phase !== 'idle';
  const visible = isActive && !onPomodoroPage;

  const timeLeft = timer.getTimeLeft();
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  const totalDuration = (() => {
    switch (timer.phase) {
      case 'focus':      return pomodoro.focusDuration * 60;
      case 'break':      return pomodoro.breakDuration * 60;
      case 'long_break': return pomodoro.longBreakDuration * 60;
      default:           return pomodoro.focusDuration * 60;
    }
  })();

  const progress = totalDuration > 0
    ? Math.min((totalDuration - timeLeft) / totalDuration, 1)
    : 0;

  const phaseColor = timer.phase === 'focus' ? '#ef4444' : timer.phase === 'break' ? '#10b981' : '#3b82f6';
  const circumference = 2 * Math.PI * 18;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.05}
          whileDrag={{ scale: 1.06 }}
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="absolute z-[200] cursor-grab active:cursor-grabbing"
          style={{ right: 12, bottom: 'calc(var(--bottom-nav-height, 64px) + 12px)' }}
        >
          <div
            className="flex items-center gap-2.5 rounded-2xl border border-border bg-bg-card/95 px-3 py-2.5 shadow-2xl"
            style={{
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px ${phaseColor}22`,
            }}
          >
            {/* Progress ring */}
            <div className="relative h-10 w-10 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="none" stroke="var(--bg-tertiary)" strokeWidth="3" />
                <circle
                  cx="20" cy="20" r="18"
                  fill="none"
                  stroke={phaseColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                />
              </svg>
              <Timer
                size={13}
                className="absolute inset-0 m-auto"
                style={{ color: phaseColor }}
              />
            </div>

            {/* Time */}
            <div className="flex flex-col leading-none">
              <span className="font-mono text-base font-bold text-text-primary tabular-nums">
                {minutes}:{seconds}
              </span>
              <span className="text-[10px] font-medium" style={{ color: phaseColor }}>
                {timer.phase === 'focus' ? 'Foco' : timer.phase === 'break' ? 'Pausa' : 'Pausa Longa'}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                data-sound="none"
                onClick={(e) => { e.stopPropagation(); timer.isRunning ? timer.pause() : timer.resume(); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                style={{ backgroundColor: `${phaseColor}22`, color: phaseColor }}
              >
                {timer.isRunning ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
              </button>

              <button
                data-sound="none"
                onClick={(e) => { e.stopPropagation(); router.push('/pomodoro'); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-tertiary text-text-dim hover:text-text-primary transition-colors"
                title="Abrir Pomodoro"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </button>

              <button
                data-sound="none"
                onClick={(e) => { e.stopPropagation(); timer.reset(pomodoro.focusDuration * 60); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-tertiary text-text-dim hover:text-accent-red transition-colors"
                title="Parar timer"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
