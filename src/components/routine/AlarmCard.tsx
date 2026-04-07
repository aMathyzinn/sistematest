'use client';

import type { Alarm } from '@/lib/types';
import { Bell, BellOff, Trash2 } from 'lucide-react';
import * as db from '@/lib/db/queries';

const typeConfig = {
  wake: { icon: '🌅', label: 'Acordar' },
  reminder: { icon: '📢', label: 'Lembrete' },
  break: { icon: '☕', label: 'Pausa' },
  sleep: { icon: '🌙', label: 'Dormir' },
};

interface AlarmCardProps {
  alarm: Alarm;
  onUpdate?: () => void;
}

export default function AlarmCard({ alarm, onUpdate }: AlarmCardProps) {
  const config = typeConfig[alarm.type];

  const toggleAlarm = async () => {
    await db.updateAlarm(alarm.id, { isActive: !alarm.isActive });
    onUpdate?.();
  };

  const handleDelete = async () => {
    await db.deleteAlarm(alarm.id);
    onUpdate?.();
  };

  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-bg-card/60 backdrop-blur-sm border border-white/[0.05] px-4 py-3 transition-opacity ${!alarm.isActive ? 'opacity-50' : ''}`}>
      <span className="text-lg">{config.icon}</span>

      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xl font-bold text-text-primary">{alarm.time}</span>
          <span className="text-xs text-text-dim">{config.label}</span>
        </div>
        <p className="text-xs text-text-secondary">{alarm.title}</p>
        {alarm.isRecurring && alarm.days && (
          <p className="text-[10px] text-text-dim mt-0.5">
            {alarm.days.map(d => ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d]).join(' ')}
          </p>
        )}
      </div>

      <button
        onClick={toggleAlarm}
        className={`p-2 rounded-lg transition-colors ${alarm.isActive ? 'bg-accent-purple/20 text-accent-purple-light' : 'bg-bg-tertiary text-text-dim'}`}
      >
        {alarm.isActive ? <Bell size={16} /> : <BellOff size={16} />}
      </button>

      <button
        onClick={handleDelete}
        className="p-2 text-text-dim hover:text-accent-red transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
