'use client';

import type { Task } from '@/lib/types';
import { motion } from 'framer-motion';
import { Check, Trash2, Code2, BookOpen, Dumbbell, Briefcase, Home, Target, Pin } from 'lucide-react';
import * as db from '@/lib/db/queries';
import { useUserStore } from '@/stores/userStore';

const priorityColors = {
  low: 'border-l-accent-green',
  medium: 'border-l-accent-blue',
  high: 'border-l-accent-orange',
  urgent: 'border-l-accent-red',
};

const categoryConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  programming: { icon: Code2,     color: 'text-accent-blue-light',  bg: 'bg-accent-blue/10' },
  study:       { icon: BookOpen,  color: 'text-accent-cyan',         bg: 'bg-accent-cyan/10' },
  health:      { icon: Dumbbell,  color: 'text-accent-orange',       bg: 'bg-accent-orange/10' },
  work:        { icon: Briefcase, color: 'text-accent-yellow',       bg: 'bg-accent-yellow/10' },
  personal:    { icon: Home,      color: 'text-accent-purple-light', bg: 'bg-accent-purple/10' },
  discipline:  { icon: Target,    color: 'text-accent-red',          bg: 'bg-accent-red/10' },
  custom:      { icon: Pin,       color: 'text-text-secondary',      bg: 'bg-bg-tertiary' },
};

interface TaskItemProps {
  task: Task;
  onUpdate?: () => void;
}

export default function TaskItem({ task, onUpdate }: TaskItemProps) {
  const { addXP } = useUserStore();
  const isCompleted = task.status === 'completed';
  const catCfg = categoryConfig[task.category] ?? categoryConfig.custom;
  const CatIcon = catCfg.icon;

  const handleComplete = async () => {
    if (isCompleted) return;
    try {
      await db.updateTask(task.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      addXP(task.xpReward, 'focus');

      const today = new Date().toISOString().split('T')[0];
      const log = await db.getDailyLog(today);
      await db.upsertDailyLog(today, {
        tasksCompleted: (log?.tasksCompleted || 0) + 1,
        xpEarned: (log?.xpEarned || 0) + task.xpReward,
      });

      onUpdate?.();
    } catch {
      // DB write failed — reload to show the actual state
      onUpdate?.();
    }
  };

  const handleDelete = async () => {
    try {
      await db.deleteTask(task.id);
      onUpdate?.();
    } catch {
      onUpdate?.();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`flex items-center gap-3 rounded-2xl border-l-2 bg-bg-card/70 backdrop-blur-sm px-3 py-3 transition-all ${
        priorityColors[task.priority]
      } ${isCompleted ? 'opacity-50' : 'border-r border-t border-b border-white/[0.05]'}`}
    >
      {/* Check button */}
      <button
        onClick={handleComplete}
        data-sound="success"
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
          isCompleted
            ? 'border-accent-green bg-accent-green/20 text-accent-green'
            : 'border-border hover:border-accent-green hover:bg-accent-green/10'
        }`}
      >
        {isCompleted && <Check size={12} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${catCfg.bg}`}>
            <CatIcon size={11} className={catCfg.color} />
          </span>
          <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-text-dim' : 'text-text-primary'}`}>
            {task.title}
          </p>
        </div>
        {task.description && (
          <p className="mt-0.5 text-xs text-text-dim truncate pl-7">{task.description}</p>
        )}
      </div>

      {/* XP + Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold text-accent-yellow">+{task.xpReward}</span>
        {!isCompleted && (
          <button
            onClick={handleDelete}
            data-sound="delete"
            className="p-1 text-text-dim hover:text-accent-red transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
