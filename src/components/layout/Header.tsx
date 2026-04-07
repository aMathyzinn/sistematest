'use client';

import { useUserStore } from '@/stores/userStore';
import { Settings, Zap, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { level, profile, userId } = useUserStore();
  const router = useRouter();
  const xpPercent = Math.min((level.xp / level.xpToNext) * 100, 100);
  const displayName = profile?.name || (userId ? '...' : 'Jogador');

  return (
    <header className="shrink-0 z-40 bg-bg-primary/90 backdrop-blur-xl" style={{ borderBottom: '1px solid rgba(139,92,246,0.12)', boxShadow: '0 1px 20px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Level Badge */}
        <div className="flex items-center gap-3">
          <div
            data-tutorial="level-badge"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-purple/30 to-accent-blue/20 border border-accent-purple/25 animate-pulse-glow">
            <span className="text-xs font-bold text-accent-purple-light">
              {level.level}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-text-primary leading-tight">
              {displayName}
            </span>
            <div className="xp-bar mt-1 h-1 w-20">
              <div
                className="xp-bar-fill h-full"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[9px] text-text-dim mt-0.5 flex items-center gap-0.5">
              <Zap size={8} className="text-accent-yellow" />
              {level.xp}/{level.xpToNext} XP
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center">
          <h1 className="text-[10px] font-bold tracking-[0.25em] text-accent-purple-light/90 glow-text uppercase">
            Sistema
          </h1>
          <div className="flex items-center gap-1 mt-0.5">
            <Flame size={9} className="text-accent-orange/70" />
            <span className="text-[8px] text-text-dim">Em evolução</span>
          </div>
        </div>

        {/* Settings */}
        <button
          onClick={() => router.push('/settings')}
          className="rounded-xl p-2 text-text-dim hover:text-text-primary hover:bg-white/[0.05] transition-all active:scale-95 border border-transparent hover:border-white/[0.06]"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
