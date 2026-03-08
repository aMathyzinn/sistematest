'use client';

import { useState, useEffect } from 'react';
import * as db from '@/lib/db/queries';
import type { ExerciseLog, ExerciseSet, MuscleGroup } from '@/lib/types';
import { Plus, Trash2, Dumbbell, ChevronDown, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MUSCLE_GROUPS: { value: MuscleGroup; label: string; emoji: string }[] = [
  { value: 'chest', label: 'Peito', emoji: '💪' },
  { value: 'back', label: 'Costas', emoji: '🔙' },
  { value: 'shoulders', label: 'Ombros', emoji: '🏋️' },
  { value: 'arms', label: 'Braços', emoji: '💪' },
  { value: 'legs', label: 'Pernas', emoji: '🦵' },
  { value: 'core', label: 'Core', emoji: '⚡' },
  { value: 'cardio', label: 'Cardio', emoji: '🏃' },
  { value: 'full_body', label: 'Corpo todo', emoji: '🔥' },
];

const MUSCLE_LABEL = (mg: MuscleGroup) => MUSCLE_GROUPS.find((m) => m.value === mg)?.label || mg;
const MUSCLE_EMOJI = (mg: MuscleGroup) => MUSCLE_GROUPS.find((m) => m.value === mg)?.emoji || '💪';

type Tab = 'hoje' | 'historico';

export default function ExercisesPage() {
  const [tab, setTab] = useState<Tab>('hoje');
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [todayLogs, setTodayLogs] = useState<ExerciseLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup>('chest');
  const [notes, setNotes] = useState('');
  const [sets, setSets] = useState<ExerciseSet[]>([{ reps: 10, weight: 0 }]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [all, tod] = await Promise.all([
        db.getExerciseLogs(60),
        db.getExerciseLogsByDate(today),
      ]);
      setLogs(all);
      setTodayLogs(tod);
    } catch {
      // DB não pronta
    }
  };

  const addSet = () => setSets([...sets, { reps: 10, weight: 0 }]);
  const removeSet = (i: number) => setSets(sets.filter((_, idx) => idx !== i));
  const updateSet = (i: number, field: keyof ExerciseSet, val: number) => {
    setSets(sets.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await db.addExerciseLog({
        name: name.trim(),
        muscleGroup: muscle,
        sets,
        notes: notes.trim() || undefined,
        date: today,
      });
      setName('');
      setMuscle('chest');
      setNotes('');
      setSets([{ reps: 10, weight: 0 }]);
      setShowForm(false);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar treino');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await db.deleteExerciseLog(id);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao deletar treino');
    }
  };

  // Group history by date
  const grouped = logs.reduce<Record<string, ExerciseLog[]>>((acc, log) => {
    (acc[log.date] ||= []).push(log);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="px-4 py-4 space-y-4">
        {/* Error banner */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-300">✕</button>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell size={20} className="text-accent-purple-light" />
            <h2 className="text-lg font-bold text-text-primary">Exercícios</h2>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-accent-purple/10 border border-accent-purple/30 px-3 py-1.5 text-xs font-medium text-accent-purple-light hover:bg-accent-purple/20 transition-colors"
          >
            <Plus size={14} /> Registrar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 rounded-xl bg-bg-secondary p-1">
          {(['hoje', 'historico'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all capitalize ${
                tab === t ? 'bg-accent-purple text-white shadow' : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {t === 'hoje' ? 'Hoje' : 'Histórico'}
            </button>
          ))}
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl bg-bg-card border border-border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Novo Exercício</p>
                <button onClick={() => setShowForm(false)} className="text-text-dim hover:text-text-primary">
                  <X size={16} />
                </button>
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do exercício (ex: Supino reto)"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none"
              />

              {/* Muscle group select */}
              <div className="grid grid-cols-4 gap-1.5">
                {MUSCLE_GROUPS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMuscle(m.value)}
                    className={`rounded-lg py-1.5 text-center text-xs transition-all ${
                      muscle === m.value
                        ? 'bg-accent-purple/20 ring-1 ring-accent-purple text-accent-purple-light'
                        : 'bg-bg-tertiary text-text-dim hover:text-text-secondary'
                    }`}
                  >
                    <div className="text-base">{m.emoji}</div>
                    <div className="text-[10px] leading-tight">{m.label}</div>
                  </button>
                ))}
              </div>

              {/* Sets */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-secondary">Séries</p>
                {sets.map((set, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-text-dim w-4">{i + 1}</span>
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1">
                        <p className="text-[10px] text-text-dim mb-0.5">Reps</p>
                        <input
                          type="number"
                          value={set.reps}
                          min={1}
                          onChange={(e) => updateSet(i, 'reps', Number(e.target.value))}
                          className="w-full rounded border border-border bg-bg-tertiary px-2 py-1 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-text-dim mb-0.5">Peso (kg)</p>
                        <input
                          type="number"
                          value={set.weight ?? 0}
                          min={0}
                          step={0.5}
                          onChange={(e) => updateSet(i, 'weight', Number(e.target.value))}
                          className="w-full rounded border border-border bg-bg-tertiary px-2 py-1 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
                        />
                      </div>
                    </div>
                    {sets.length > 1 && (
                      <button onClick={() => removeSet(i)} className="text-accent-red/70 hover:text-accent-red">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addSet}
                  className="flex items-center gap-1 text-xs text-accent-purple-light hover:text-accent-purple"
                >
                  <Plus size={12} /> Adicionar série
                </button>
              </div>

              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações (opcional)"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none"
              />

              <button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="w-full rounded-lg bg-accent-purple py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {saving ? 'Salvando...' : 'Salvar Exercício'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {tab === 'hoje' && (
          <div className="space-y-2">
            {todayLogs.length === 0 && !showForm && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple/10 text-3xl">
                  🏋️
                </div>
                <p className="text-sm text-text-secondary">Nenhum exercício hoje</p>
                <p className="text-xs text-text-dim mt-1">Registre seu treino acima</p>
              </div>
            )}
            {todayLogs.map((log, i) => (
              <ExerciseCard key={log.id} log={log} index={i} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {tab === 'historico' && (
          <div className="space-y-4">
            {sortedDates.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-text-secondary">Nenhum histórico ainda</p>
              </div>
            )}
            {sortedDates.map((date) => (
              <div key={date} className="space-y-2">
                <p className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                  {date === today ? 'Hoje' : formatDate(date)}
                </p>
                {grouped[date].map((log, i) => (
                  <ExerciseCard key={log.id} log={log} index={i} onDelete={handleDelete} compact />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
  );
}

function ExerciseCard({
  log,
  index,
  onDelete,
  compact,
}: {
  log: ExerciseLog;
  index: number;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  const totalVolume = log.sets.reduce((acc, s) => acc + (s.reps * (s.weight || 0)), 0);
  const totalReps = log.sets.reduce((acc, s) => acc + s.reps, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl bg-bg-card border border-border overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-purple/10 text-lg">
          {MUSCLE_EMOJI(log.muscleGroup)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{log.name}</p>
          <p className="text-xs text-text-dim">{MUSCLE_LABEL(log.muscleGroup)} · {log.sets.length} séries · {totalReps} reps{totalVolume > 0 ? ` · ${totalVolume}kg` : ''}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDelete(log.id)}
            className="rounded p-1 text-text-dim hover:text-accent-red transition-colors"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setOpen(!open)}
            className={`rounded p-1 text-text-dim transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="px-4 py-3 space-y-1.5">
              {log.sets.map((set, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="text-text-dim w-12">Série {i + 1}</span>
                  <span className="flex items-center gap-1">
                    <Check size={10} className="text-accent-green" />
                    {set.reps} reps
                  </span>
                  {(set.weight || 0) > 0 && (
                    <span className="text-text-dim">{set.weight}kg</span>
                  )}
                </div>
              ))}
              {log.notes && (
                <p className="text-xs text-text-dim italic mt-2">{log.notes}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
}
