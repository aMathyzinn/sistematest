'use client';

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { playClick, playNavSwitch, playToggle, playSuccess, playDelete, markUserGesture } from '@/lib/audio';

const soundMap: Record<string, () => void> = {
  nav:     playNavSwitch,
  toggle:  playToggle,
  success: playSuccess,
  delete:  playDelete,
};

/**
 * Attaches a single document-level click listener (capture phase).
 * Also marks the first user gesture so queued voices can play.
 */
export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const enabledRef = useRef(soundEnabled);
  enabledRef.current = soundEnabled;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Always mark gesture so queued voices drain regardless of soundEnabled
      markUserGesture();
      if (!enabledRef.current) return;
      const target = e.target as HTMLElement;
      const el = target.closest<HTMLElement>('button, a, [role="button"]');
      if (!el) return;
      const sound = el.getAttribute('data-sound');
      if (sound === 'none') return;
      (soundMap[sound ?? ''] ?? playClick)();
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return <>{children}</>;
}
