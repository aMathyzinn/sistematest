'use client';

import type { Mission } from '@/lib/types';
import { motion } from 'framer-motion';
import { Swords, Brain, Zap, Shield, Check, X } from 'lucide-react';
import * as db from '@/lib/db/queries';
import { useUserStore } from '@/stores/userStore';

const missionTypeConfig = {
  physical: { icon: Swords, color: 'accent-orange', label: 'Físico' },
  mental: { icon: Brain, color: 'accent-cyan', label: 'Mental' },
  productivity: { icon: Zap, color: 'accent-blue', label: 'Produtividade' },
  discipline: { icon: Shield, color: 'accent-red', label: 'Disciplina' },
};

interface MissionCardProps {
  mission: Mission;
  onUpdate?: () => void;
}

export default function MissionCard({ mission, onUpdate }: MissionCardProps) {
  const config = missionTypeConfig[mission.type];
  const { addXP } = useUserStore();
  const isCompleted = mission.status === 'completed';
  const isFailed = mission.status === 'failed';

  const handleComplete = async () => {
    if (isCompleted || isFailed) return;
    await db.updateMission(mission.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    addXP(mission.xpReward, Object.keys(mission.attributeBonus || {})[0] as keyof import('@/lib/types').UserAttributes | undefined);

    const today = new Date().toISOString().split('T')[0];
    const log = await db.getDailyLog(today);
    await db.upsertDailyLog(today, {
      missionsCompleted: (log?.missionsCompleted || 0) + 1,
      xpEarned: (log?.xpEarned || 0) + mission.xpReward,
    });

    onUpdate?.();
  };

  const handleFail = async () => {
    await db.updateMission(mission.id, { status: 'failed' });
    onUpdate?.();
  };

  const progressPercent = mission.target
    ? Math.min(((mission.progress || 0) / mission.target) * 100, 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-3 transition-all ${
        isCompleted
          ? 'border-accent-green/30 bg-accent-green/5'
          : isFailed
          ? 'border-accent-red/30 bg-accent-red/5 opacity-60'
          : 'border-border bg-bg-card hover:border-' + config.color + '/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-${config.color}/10`}>
          <config.icon size={18} className={`text-${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-medium ${isCompleted ? 'line-through text-text-dim' : 'text-text-primary'}`}>
                {mission.title}
              </p>
              <span className={`inline-block mt-0.5 text-[10px] font-medium text-${config.color}`}>
                {config.label}
              </span>
            </div>
            <span className="shrink-0 rounded-md bg-accent-yellow/10 px-2 py-0.5 text-[10px] font-bold text-accent-yellow">
              +{mission.xpReward} XP
            </span>
          </div>

          {mission.description && (
            <p className="mt-1 text-xs text-text-dim">{mission.description}</p>
          )}

          {/* Progress bar */}
          {mission.target && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-text-dim mb-1">
                <span>{mission.progress || 0}/{mission.target}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-bg-tertiary">
                <div
                  className={`h-full rounded-full bg-${config.color} transition-all duration-500`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isCompleted && !isFailed && (
          <div className="flex flex-col gap-1">
            <button
              onClick={handleComplete}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleFail}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
