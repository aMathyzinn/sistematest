'use client';

import { useState, useEffect, useCallback } from 'react';
import RoutineBlockComponent from '@/components/routine/RoutineBlock';
import AlarmCard from '@/components/routine/AlarmCard';
import type { RoutineBlock, Alarm } from '@/lib/types';
import * as db from '@/lib/db/queries';
import { Clock, Bell, Plus } from 'lucide-react';

export default function RoutinePage() {
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [tab, setTab] = useState<'routine' | 'alarms'>('routine');
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({ title: '', startTime: '09:00', endTime: '10:00' });

  const loadData = useCallback(async () => {
    try {
      const routineData = await db.getAllRoutineBlocks();
      const today = new Date().getDay();
      const filtered = routineData.filter(
        (b) => !b.days || b.days.length === 0 || b.days.includes(today)
      );
      setBlocks(filtered.sort((a, b) => a.startTime.localeCompare(b.startTime)));

      const alarmsData = await db.getAllAlarms();
      setAlarms(alarmsData);
    } catch {
      // DB not ready
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddBlock = async () => {
    if (!newBlock.title.trim()) return;
    await db.addRoutineBlock({
      title: newBlock.title.trim(),
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      category: 'custom',
      isRecurring: true,
    });
    setNewBlock({ title: '', startTime: '09:00', endTime: '10:00' });
    setShowAddBlock(false);
    loadData();
  };

  return (
    <div className="px-4 py-3 space-y-3">
        <h2 className="text-base font-bold text-text-primary">Rotina & Alarmes</h2>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('routine')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'routine'
                ? 'bg-accent-purple/20 text-accent-purple-light'
                : 'bg-bg-card text-text-dim border border-border'
            }`}
          >
            <Clock size={14} />
            Rotina
          </button>
          <button
            onClick={() => setTab('alarms')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'alarms'
                ? 'bg-accent-purple/20 text-accent-purple-light'
                : 'bg-bg-card text-text-dim border border-border'
            }`}
          >
            <Bell size={14} />
            Alarmes
          </button>
        </div>

        {tab === 'routine' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-dim">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <button
                onClick={() => setShowAddBlock(!showAddBlock)}
                className="flex items-center gap-1 rounded-lg bg-accent-purple/10 px-3 py-1 text-xs font-medium text-accent-purple-light"
              >
                <Plus size={12} />
                Adicionar
              </button>
            </div>

            {showAddBlock && (
              <div className="rounded-2xl bg-bg-card/60 backdrop-blur-sm border border-white/[0.05] p-3 space-y-2">
                <input
                  type="text"
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                  placeholder="Nome do bloco..."
                  className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-text-dim">Início</label>
                    <input
                      type="time"
                      value={newBlock.startTime}
                      onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                      className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-1.5 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-text-dim">Fim</label>
                    <input
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                      className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-1.5 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddBlock}
                  className="w-full rounded-lg bg-accent-purple py-2 text-sm font-medium text-white"
                >
                  Adicionar
                </button>
              </div>
            )}

            {/* Timeline */}
            <div className="relative space-y-2 pl-4">
              <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
              {blocks.map((block) => (
                <div key={block.id} className="relative">
                  <div className="absolute -left-2.5 top-3 h-2 w-2 rounded-full bg-accent-purple" />
                  <RoutineBlockComponent block={block} onDelete={loadData} />
                </div>
              ))}
            </div>

            {blocks.length === 0 && (
              <p className="py-8 text-center text-sm text-text-dim">
                Nenhum bloco de rotina. Converse com o Sistema ou adicione manualmente.
              </p>
            )}
          </div>
        )}

        {tab === 'alarms' && (
          <div className="space-y-3">
            {alarms.map((alarm) => (
              <AlarmCard key={alarm.id} alarm={alarm} onUpdate={loadData} />
            ))}

            {alarms.length === 0 && (
              <p className="py-8 text-center text-sm text-text-dim">
                Nenhum alarme configurado. O Sistema pode criar alarmes para você.
              </p>
            )}
          </div>
        )}
      </div>
  );
}
