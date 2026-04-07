'use client';

import { useState } from 'react';
import type { Mission, MissionStep } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Brain, Zap, Shield, Check, X, ChevronDown, Circle, CheckCircle2, BotMessageSquare } from 'lucide-react';
import * as db from '@/lib/db/queries';
import { useUserStore } from '@/stores/userStore';
import { playVoiceMissionComplete, playVoiceAllMissionsDone } from '@/lib/audio';
import MissionChatPopup from './MissionChatPopup';

const missionTypeConfig = {
  physical:     { icon: Swords,  color: 'text-accent-orange', bg: 'bg-accent-orange/10', label: 'Físico' },
  mental:       { icon: Brain,   color: 'text-accent-cyan',   bg: 'bg-accent-cyan/10',   label: 'Mental' },
  productivity: { icon: Zap,     color: 'text-accent-blue',   bg: 'bg-accent-blue/10',   label: 'Produtividade' },
  discipline:   { icon: Shield,  color: 'text-accent-red',    bg: 'bg-accent-red/10',    label: 'Disciplina' },
};

const progressColor = {
  physical:     'bg-accent-orange',
  mental:       'bg-accent-cyan',
  productivity: 'bg-accent-blue',
  discipline:   'bg-accent-red',
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
  const hasSteps = (mission.steps?.length || 0) > 0;
  const [expanded, setExpanded] = useState(!isCompleted && !isFailed);
  const [showChat, setShowChat] = useState(false);

  const doneSteps = mission.steps?.filter((s) => s.done).length ?? 0;
  const totalSteps = mission.steps?.length ?? 0;
  const progressPercent = totalSteps > 0
    ? Math.round((doneSteps / totalSteps) * 100)
    : mission.target
    ? Math.min(Math.round(((mission.progress || 0) / mission.target) * 100), 100)
    : 0;

  const handleToggleStep = async (step: MissionStep) => {
    if (isCompleted || isFailed) return;
    const updatedSteps = (mission.steps || []).map((s) =>
      s.id === step.id ? { ...s, done: !s.done } : s
    );
    const newDone = updatedSteps.filter((s) => s.done).length;
    const allDone = newDone === updatedSteps.length;

    await db.updateMission(mission.id, {
      steps: updatedSteps,
      progress: newDone,
      ...(allDone ? { status: 'completed', completedAt: new Date().toISOString() } : {}),
    });

    if (allDone) {
      addXP(mission.xpReward, Object.keys(mission.attributeBonus || {})[0] as keyof import('@/lib/types').UserAttributes | undefined);
      const today = new Date().toISOString().split('T')[0];
      const log = await db.getDailyLog(today);
      await db.upsertDailyLog(today, {
        missionsCompleted: (log?.missionsCompleted || 0) + 1,
        xpEarned: (log?.xpEarned || 0) + mission.xpReward,
      });
      // Check if all available missions are now done
      const allMissions = await db.getAllMissions();
      const stillActive = allMissions.filter((m) => m.status === 'pending' && m.id !== mission.id);
      if (stillActive.length === 0) {
        playVoiceAllMissionsDone();
      } else {
        playVoiceMissionComplete();
      }
    }
    onUpdate?.();
  };

  const handleComplete = async () => {
    if (isCompleted || isFailed) return;
    const allDoneSteps = (mission.steps || []).map((s) => ({ ...s, done: true }));
    await db.updateMission(mission.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      ...(hasSteps ? { steps: allDoneSteps, progress: allDoneSteps.length } : {}),
    });
    addXP(mission.xpReward, Object.keys(mission.attributeBonus || {})[0] as keyof import('@/lib/types').UserAttributes | undefined);
    const today = new Date().toISOString().split('T')[0];
    const log = await db.getDailyLog(today);
    await db.upsertDailyLog(today, {
      missionsCompleted: (log?.missionsCompleted || 0) + 1,
      xpEarned: (log?.xpEarned || 0) + mission.xpReward,
    });
    // Check if all available missions are now done
    const allMissions = await db.getAllMissions();
    const stillActive = allMissions.filter((m) => m.status === 'pending' && m.id !== mission.id);
    if (stillActive.length === 0) {
      playVoiceAllMissionsDone();
    } else {
      playVoiceMissionComplete();
    }
    onUpdate?.();
  };

  const handleFail = async () => {
    await db.updateMission(mission.id, { status: 'failed' });
    onUpdate?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden transition-all ${
        isCompleted
          ? 'border-accent-green/20 bg-accent-green/[0.04]'
          : isFailed
          ? 'border-accent-red/15 bg-accent-red/[0.03] opacity-60'
          : 'border-white/[0.06] bg-bg-card backdrop-blur-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
          <config.icon size={16} className={config.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-sm font-medium leading-tight ${isCompleted ? 'line-through text-text-dim' : 'text-text-primary'}`}>
                {mission.title}
              </p>
              <span className={`inline-block mt-0.5 text-[10px] font-medium ${config.color}`}>
                {config.label}
              </span>
            </div>
            <span className="shrink-0 rounded-md bg-accent-yellow/10 px-2 py-0.5 text-[10px] font-bold text-accent-yellow">
              +{mission.xpReward} XP
            </span>
          </div>

          {/* Description */}
          {mission.description && (
            <p className="mt-1 text-xs text-text-dim leading-relaxed">{mission.description}</p>
          )}

          {/* Progress bar */}
          {(hasSteps || mission.target) && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-text-dim mb-1">
                <span>
                  {hasSteps
                    ? `${doneSteps}/${totalSteps} etapas`
                    : `${mission.progress || 0}/${mission.target}`}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-bg-tertiary overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isCompleted ? 'bg-accent-green' : progressColor[mission.type]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1 shrink-0">
          {!isCompleted && !isFailed && (
            <>
              <button
                onClick={handleComplete}
                data-sound="success"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors"
                title="Concluir tudo"
              >
                <Check size={13} />
              </button>
              <button
                onClick={handleFail}
                data-sound="delete"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
                title="Falhou"
              >
                <X size={13} />
              </button>
            </>
          )}
          {/* Me ajude button */}
          {!isCompleted && !isFailed && (
            <button
              onClick={() => setShowChat(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-purple/10 text-accent-purple-light hover:bg-accent-purple/20 transition-colors"
              title="Me ajude nesta missão"
            >
              <BotMessageSquare size={13} />
            </button>
          )}
          {hasSteps && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-text-dim hover:text-text-secondary transition-all ${expanded ? 'rotate-180' : ''}`}
            >
              <ChevronDown size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Steps list */}
      <AnimatePresence initial={false}>
        {hasSteps && expanded && (
          <motion.div
            key="steps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="px-3 py-2 space-y-1">
              {mission.steps!.map((step, i) => (
                <StepRow
                  key={step.id}
                  step={step}
                  index={i}
                  disabled={isCompleted || isFailed}
                  onToggle={() => handleToggleStep(step)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mission AI chat popup */}
      <AnimatePresence>
        {showChat && (
          <MissionChatPopup
            mission={mission}
            onClose={() => setShowChat(false)}
            onMissionUpdated={() => { onUpdate?.(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StepRow({
  step,
  index,
  disabled,
  onToggle,
}: {
  step: MissionStep;
  index: number;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onToggle}
      disabled={disabled}
      data-sound="toggle"
      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
        disabled ? 'cursor-default' : 'hover:bg-bg-hover'
      }`}
    >
      {step.done ? (
        <CheckCircle2 size={16} className="text-accent-green shrink-0" />
      ) : (
        <Circle size={16} className="text-text-dim shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className={`text-xs ${step.done ? 'line-through text-text-dim' : 'text-text-secondary'}`}>
          {step.title}
        </span>
        {step.target && step.unit && !step.done && (
          <span className="ml-1.5 text-[10px] text-text-dim">
            {step.target} {step.unit}
          </span>
        )}
      </div>
      {step.done && (
        <span className="text-[10px] text-accent-green shrink-0">✓</span>
      )}
    </motion.button>
  );
}

