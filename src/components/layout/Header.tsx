'use client';

import { useUserStore } from '@/stores/userStore';
import { Settings, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { level, profile } = useUserStore();
  const router = useRouter();
  const xpPercent = Math.min((level.xp / level.xpToNext) * 100, 100);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        {/* Level Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-purple/20 border border-accent-purple/30 animate-pulse-glow">
            <span className="text-sm font-bold text-accent-purple-light">
              {level.level}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-text-dim">
              {profile?.name || 'Jogador'}
            </span>
            {/* XP Bar */}
            <div className="xp-bar mt-1 h-1.5 w-24">
              <div
                className="xp-bar-fill h-full"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-text-dim mt-0.5">
              <Zap size={10} className="inline mr-0.5 text-accent-yellow" />
              {level.xp}/{level.xpToNext} XP
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-sm font-bold tracking-wider text-text-accent glow-text">
          SISTEMA
        </h1>

        {/* Settings */}
        <button
          onClick={() => router.push('/settings')}
          className="rounded-lg p-2 text-text-dim hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
