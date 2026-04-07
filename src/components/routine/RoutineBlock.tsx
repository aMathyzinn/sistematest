'use client';

import type { RoutineBlock as RoutineBlockType } from '@/lib/types';
import { Clock, Trash2 } from 'lucide-react';
import * as db from '@/lib/db/queries';

const categoryColors: Record<string, string> = {
  programming: 'border-l-accent-cyan',
  study: 'border-l-accent-blue',
  health: 'border-l-accent-green',
  work: 'border-l-accent-orange',
  personal: 'border-l-accent-purple',
  discipline: 'border-l-accent-red',
  custom: 'border-l-accent-yellow',
};

interface RoutineBlockProps {
  block: RoutineBlockType;
  onDelete?: () => void;
}

export default function RoutineBlock({ block, onDelete }: RoutineBlockProps) {
  const handleDelete = async () => {
    await db.deleteRoutineBlock(block.id);
    onDelete?.();
  };

  return (
    <div className={`flex items-center gap-3 rounded-2xl border-l-2 bg-bg-card/60 backdrop-blur-sm border border-white/[0.05] px-3 py-3 ${categoryColors[block.category] || 'border-l-accent-purple'}`}>
      <div className="flex flex-col items-center shrink-0">
        <span className="font-mono text-xs font-bold text-accent-blue">{block.startTime}</span>
        <div className="h-3 w-px bg-border my-0.5" />
        <span className="font-mono text-xs text-text-dim">{block.endTime}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{block.title}</p>
        {block.isRecurring && block.days && (
          <p className="text-[10px] text-text-dim mt-0.5">
            {block.days.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ')}
          </p>
        )}
      </div>

      <button
        onClick={handleDelete}
        className="p-1.5 text-text-dim hover:text-accent-red transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
