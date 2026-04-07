'use client';

import { useUserStore } from '@/stores/userStore';
import { Settings, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { level, profile, userId } = useUserStore();
  const router = useRouter();
  const xpPercent = Math.min((level.xp / level.xpToNext) * 100, 100);
  const displayName = profile?.name || (userId ? '...' : 'Jogador');

  return (
    <header className="shrink-0 z-40 border-b border-white/[0.04] bg-bg-primary/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Level Badge */}
        <div className="flex items-center gap-3">
          <div
            data-tutorial="level-badge"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-purple/25 to-accent-blue/15 border border-accent-purple/20 animate-pulse-glow">
            <span className="text-xs font-bold text-accent-purple-light">
              {level.level}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-text-secondary">
              {displayName}
            </span>
            <div className="xp-bar mt-1 h-1 w-20">
              <div
                className="xp-bar-fill h-full"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[9px] text-text-dim mt-0.5">
              <Zap size={8} className="inline mr-0.5 text-accent-yellow" />
              {level.xp}/{level.xpToNext}
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xs font-bold tracking-[0.2em] text-accent-purple-light/80 glow-text uppercase">
          Sistema
        </h1>

        {/* Settings */}
        <button
          onClick={() => router.push('/settings')}
          className="rounded-xl p-2 text-text-dim hover:text-text-primary hover:bg-white/[0.04] transition-all active:scale-95"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
