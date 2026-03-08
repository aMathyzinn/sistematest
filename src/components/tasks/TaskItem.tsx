'use client';

import type { Task } from '@/lib/types';
import { motion } from 'framer-motion';
import { Check, Trash2, ChevronRight } from 'lucide-react';
import * as db from '@/lib/db/queries';
import { useUserStore } from '@/stores/userStore';

const priorityColors = {
  low: 'border-l-accent-green',
  medium: 'border-l-accent-blue',
  high: 'border-l-accent-orange',
  urgent: 'border-l-accent-red',
};

const categoryIcons: Record<string, string> = {
  programming: '💻',
  study: '📚',
  health: '💪',
  work: '💼',
  personal: '🏠',
  discipline: '🎯',
  custom: '📌',
};

interface TaskItemProps {
  task: Task;
  onUpdate?: () => void;
}

export default function TaskItem({ task, onUpdate }: TaskItemProps) {
  const { addXP } = useUserStore();
  const isCompleted = task.status === 'completed';

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
      className={`flex items-center gap-3 rounded-xl border-l-2 bg-bg-card px-3 py-3 transition-all ${
        priorityColors[task.priority]
      } ${isCompleted ? 'opacity-60' : 'border-r border-t border-b border-border'}`}
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
          <span className="text-xs">{categoryIcons[task.category] || '📌'}</span>
          <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-text-dim' : 'text-text-primary'}`}>
            {task.title}
          </p>
        </div>
        {task.description && (
          <p className="mt-0.5 text-xs text-text-dim truncate">{task.description}</p>
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
