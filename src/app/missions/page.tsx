'use client';

import { useState, useEffect, useCallback } from 'react';
import MissionCard from '@/components/missions/MissionCard';
import XPBar from '@/components/missions/XPBar';
import type { Mission, MissionType } from '@/lib/types';
import * as db from '@/lib/db/queries';
import { Swords, Brain, Zap, Shield } from 'lucide-react';

const filterConfig: { type: 'all' | MissionType; label: string; icon: React.ElementType }[] = [
  { type: 'all', label: 'Todas', icon: Zap },
  { type: 'physical', label: 'Físico', icon: Swords },
  { type: 'mental', label: 'Mental', icon: Brain },
  { type: 'productivity', label: 'Produtividade', icon: Zap },
  { type: 'discipline', label: 'Disciplina', icon: Shield },
];

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filter, setFilter] = useState<'all' | MissionType>('all');

  const loadMissions = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let data = await db.getMissionsByDate(today);
      if (data.length === 0) {
        data = await db.getAllMissions();
      }
      if (filter !== 'all') {
        data = data.filter((m) => m.type === filter);
      }
      setMissions(data);
    } catch {
      // DB not ready or user not authenticated yet
    }
  }, [filter]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  // Reload whenever the page becomes visible again (e.g. user returns from chat
  // after the AI created a mission — ensures new missions appear immediately)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadMissions(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadMissions]);

  const completed = missions.filter((m) => m.status === 'completed').length;

  return (
    <div className="px-4 py-4 space-y-4">
        <XPBar />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Missões de Hoje</h2>
          <span className="text-xs text-text-dim">
            {completed}/{missions.length} concluídas
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterConfig.map((f) => (
            <button
              key={f.type}
              onClick={() => setFilter(f.type)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.type
                  ? 'bg-accent-purple/20 text-accent-purple-light'
                  : 'bg-bg-card text-text-dim border border-border'
              }`}
            >
              <f.icon size={12} />
              {f.label}
            </button>
          ))}
        </div>

        {/* Missions */}
        <div className="space-y-3">
          {missions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} onUpdate={loadMissions} />
          ))}

          {missions.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple/10">
                <Swords size={24} className="text-accent-purple-light" />
              </div>
              <p className="text-sm text-text-secondary">Nenhuma missão ativa</p>
              <p className="text-xs text-text-dim mt-1">
                Converse com o Sistema para gerar missões personalizadas
              </p>
            </div>
          )}
        </div>
    </div>
  );
}
