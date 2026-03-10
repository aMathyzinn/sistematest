'use client';

import { useState, useEffect } from 'react';
import * as db from '@/lib/db/queries';
import type { ExerciseLog, ExerciseSet, MuscleGroup } from '@/lib/types';
import { Plus, Trash2, Dumbbell, ChevronDown, X, Check, TrendingUp, Award, BarChart2, Zap, BookOpen } from 'lucide-react';
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

/** Minimum weekly sets per muscle for hypertrophy (evidence-based targets) */
const HYPERTROPHY_TARGETS: Partial<Record<MuscleGroup, number>> = {
  chest: 14, back: 16, shoulders: 12, arms: 14,
  legs: 16, core: 12, cardio: 3, full_body: 12,
};

interface ExerciseTemplate { name: string; muscleGroup: MuscleGroup; defaultSets: ExerciseSet[] }
interface WorkoutTemplate { id: string; label: string; emoji: string; focus: string; exercises: ExerciseTemplate[] }

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'A', label: 'Treino A', emoji: '💪', focus: 'Peito · Ombros · Tríceps',
    exercises: [
      { name: 'Supino reto com halteres', muscleGroup: 'chest', defaultSets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 8, weight: 0 }, { reps: 8, weight: 0 }] },
      { name: 'Supino inclinado', muscleGroup: 'chest', defaultSets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 8, weight: 0 }] },
      { name: 'Crossover / Peck Deck', muscleGroup: 'chest', defaultSets: [{ reps: 15, weight: 0 }, { reps: 15, weight: 0 }, { reps: 12, weight: 0 }] },
      { name: 'Desenvolvimento militar', muscleGroup: 'shoulders', defaultSets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 10, weight: 0 }] },
      { name: 'Elevação lateral', muscleGroup: 'shoulders', defaultSets: [{ reps: 15, weight: 0 }, { reps: 15, weight: 0 }, { reps: 15, weight: 0 }] },
      { name: 'Tríceps testa', muscleGroup: 'arms', defaultSets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 10, weight: 0 }] },
      { name: 'Tríceps corda', muscleGroup: 'arms', defaultSets: [{ reps: 15, weight: 0 }, { reps: 15, weight: 0 }, { reps: 12, weight: 0 }] },
    ],
  },
  {
    id: 'B', label: 'Treino B', emoji: '🔙', focus: 'Costas · Bíceps',
    exercises: [
      { name: 'Barra fixa (pull-up)', muscleGroup: 'back', defaultSets: [{ reps: 8, weight: 0 }, { reps: 8, weight: 0 }, { reps: 6, weight: 0 }, { reps: 6, weight: 0 }] },
      { name: 'Remada curvada', muscleGroup: 'back', defaultSets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 8, weight: 0 }] },
      { name: 'Puxada alta (lat pulldown)', muscleGroup: 'back', defaultSets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 10, weight: 0 }] },
      { name: 'Remada serrote', muscleGroup: 'back', defaultSets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 10, weight: 0 }] },
      { name: 'Rosca direta com barra', muscleGroup: 'arms', defaultSets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 10, weight: 0 }] },
      { name: 'Rosca martelo', muscleGroup: 'arms', defaultSets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 10, weight: 0 }] },
    ],
  },
  {
    id: 'C', label: 'Treino C', emoji: '🦵', focus: 'Pernas · Core',
    exercises: [
      { name: 'Agachamento livre', muscleGroup: 'legs', defaultSets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 8, weight: 0 }, { reps: 8, weight: 0 }] },
      { name: 'Leg press 45°', muscleGroup: 'legs', defaultSets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 10, weight: 0 }] },
      { name: 'Mesa flexora', muscleGroup: 'legs', defaultSets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 10, weight: 0 }] },
      { name: 'Cadeira extensora', muscleGroup: 'legs', defaultSets: [{ reps: 15, weight: 0 }, { reps: 15, weight: 0 }, { reps: 12, weight: 0 }] },
      { name: 'Panturrilha em pé', muscleGroup: 'legs', defaultSets: [{ reps: 20, weight: 0 }, { reps: 20, weight: 0 }, { reps: 15, weight: 0 }] },
      { name: 'Prancha abdominal (seg)', muscleGroup: 'core', defaultSets: [{ reps: 30, weight: 0 }, { reps: 30, weight: 0 }, { reps: 30, weight: 0 }] },
    ],
  },
];

type Tab = 'hoje' | 'historico' | 'stats';

export default function ExercisesPage() {
  const [tab, setTab] = useState<Tab>('hoje');
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [todayLogs, setTodayLogs] = useState<ExerciseLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

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
      setActiveTemplate(null);
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

  // Previous log for same exercise (for progressive overload hint)
  const prevLog = name.trim()
    ? logs.find((l) => l.name.toLowerCase() === name.toLowerCase().trim() && l.date !== today)
    : null;

  // Weekly stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split('T')[0];
  const weeklyLogs = logs.filter((l) => l.date >= weekStr);
  const weeklySessionCount = new Set(weeklyLogs.map((l) => l.date)).size;
  const weeklyTotalSets = weeklyLogs.reduce((acc, log) => acc + log.sets.length, 0);
  const weeklyVolume = weeklyLogs.reduce(
    (acc, log) => acc + log.sets.reduce((s, set) => s + set.reps * (set.weight || 0), 0),
    0
  );
  const setsByMuscle = weeklyLogs.reduce<Partial<Record<MuscleGroup, number>>>((acc, log) => {
    acc[log.muscleGroup] = (acc[log.muscleGroup] || 0) + log.sets.length;
    return acc;
  }, {});

  // Personal records by exercise (Epley 1RM: weight × (1 + reps/30))
  const prMap: Record<string, { exerciseName: string; weight: number; reps: number; est1RM: number }> = {};
  logs.forEach((log) => {
    log.sets.forEach((set) => {
      if (set.weight && set.weight > 0 && set.reps >= 1 && set.reps <= 12) {
        const est1RM = Math.round(set.weight * (1 + set.reps / 30));
        const key = log.name.toLowerCase().trim();
        if (!prMap[key] || est1RM > prMap[key].est1RM) {
          prMap[key] = { exerciseName: log.name, weight: set.weight, reps: set.reps, est1RM };
        }
      }
    });
  });
  const topPRs = Object.values(prMap).sort((a, b) => b.est1RM - a.est1RM).slice(0, 6);

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
          {(['hoje', 'historico', 'stats'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all capitalize ${
                tab === t ? 'bg-accent-purple text-white shadow' : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {t === 'hoje' ? 'Hoje' : t === 'historico' ? 'Histórico' : 'Stats'}
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

              {/* Progressive overload hint */}
              {prevLog && (
                <div className="flex items-center gap-2 rounded-lg bg-accent-purple/8 border border-accent-purple/15 px-3 py-1.5">
                  <TrendingUp size={11} className="text-accent-purple-light shrink-0" />
                  <p className="text-xs text-text-secondary">
                    Último: {prevLog.sets.length}×{prevLog.sets[0]?.reps} reps
                    {prevLog.sets[0]?.weight ? ` @ ${prevLog.sets[0].weight}kg` : ''}
                    <span className="text-text-dim ml-1">({formatDate(prevLog.date)})</span>
                  </p>
                </div>
              )}

              {/* Training templates */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={11} className="text-text-dim" />
                  <p className="text-xs font-medium text-text-secondary">Templates Hipertrofia</p>
                </div>
                <div className="flex gap-1.5 mb-2">
                  {WORKOUT_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => setActiveTemplate(activeTemplate === tmpl.id ? null : tmpl.id)}
                      className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition-all ${
                        activeTemplate === tmpl.id
                          ? 'bg-accent-purple/20 ring-1 ring-accent-purple text-accent-purple-light'
                          : 'bg-bg-tertiary text-text-dim hover:text-text-secondary'
                      }`}
                    >
                      <span className="text-sm">{tmpl.emoji}</span>
                      <span className="block text-[10px] leading-tight">{tmpl.label}</span>
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {activeTemplate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[10px] text-text-dim mb-1.5">
                        {WORKOUT_TEMPLATES.find((t) => t.id === activeTemplate)?.focus}
                      </p>
                      <div className="space-y-1">
                        {WORKOUT_TEMPLATES.find((t) => t.id === activeTemplate)?.exercises.map((ex) => (
                          <button
                            key={ex.name}
                            onClick={() => { setName(ex.name); setMuscle(ex.muscleGroup); setSets(ex.defaultSets.map(s => ({ ...s }))); }}
                            className="w-full text-left flex items-center justify-between rounded-lg bg-bg-tertiary hover:bg-accent-purple/10 px-3 py-2 transition-colors"
                          >
                            <span className="text-xs font-medium text-text-primary">{ex.name}</span>
                            <span className="text-[10px] text-text-dim">{MUSCLE_EMOJI(ex.muscleGroup)} {MUSCLE_LABEL(ex.muscleGroup)}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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

        {tab === 'stats' && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-bg-card border border-border p-3 text-center">
                <p className="text-xl font-bold text-text-primary">{weeklySessionCount}</p>
                <p className="text-[10px] text-text-dim mt-0.5 leading-tight">Sessões<br />esta semana</p>
              </div>
              <div className="rounded-xl bg-bg-card border border-border p-3 text-center">
                <p className="text-xl font-bold text-text-primary">{weeklyTotalSets}</p>
                <p className="text-[10px] text-text-dim mt-0.5 leading-tight">Séries<br />esta semana</p>
              </div>
              <div className="rounded-xl bg-bg-card border border-border p-3 text-center">
                <p className="text-xl font-bold text-text-primary">
                  {weeklyVolume >= 1000 ? `${(weeklyVolume / 1000).toFixed(1)}t` : weeklyVolume > 0 ? `${weeklyVolume}kg` : '—'}
                </p>
                <p className="text-[10px] text-text-dim mt-0.5 leading-tight">Volume<br />esta semana</p>
              </div>
            </div>

            {/* Muscle volume vs hypertrophy targets */}
            <div className="rounded-xl bg-bg-card border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={14} className="text-accent-purple-light" />
                <p className="text-sm font-semibold text-text-primary">Volume por Grupo Muscular</p>
                <span className="text-[10px] text-text-dim ml-auto">meta de hipertrofia</span>
              </div>
              <div className="space-y-3">
                {MUSCLE_GROUPS.map((mg) => {
                  const sets = setsByMuscle[mg.value] || 0;
                  const target = HYPERTROPHY_TARGETS[mg.value] || 10;
                  const pct = Math.min((sets / target) * 100, 100);
                  return (
                    <div key={mg.value}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-secondary">{mg.emoji} {mg.label}</span>
                        <span className={`text-xs font-medium tabular-nums ${pct >= 100 ? 'text-accent-green' : sets > 0 ? 'text-accent-purple-light' : 'text-text-dim'}`}>
                          {sets}/{target} séries
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, delay: 0.05 }}
                          className={`h-full rounded-full ${pct >= 100 ? 'bg-accent-green' : sets > 0 ? 'bg-accent-purple' : ''}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-text-dim mt-3">Séries mínimas semanais recomendadas para hipertrofia</p>
            </div>

            {/* Personal Records */}
            {topPRs.length > 0 && (
              <div className="rounded-xl bg-bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={14} className="text-accent-orange" />
                  <p className="text-sm font-semibold text-text-primary">Recordes Pessoais (1RM est.)</p>
                </div>
                <div className="space-y-2.5">
                  {topPRs.map((pr, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-text-dim w-4 tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{pr.exerciseName}</p>
                        <p className="text-[10px] text-text-dim">{pr.reps} reps @ {pr.weight}kg</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-accent-orange">{pr.est1RM}kg</p>
                        <p className="text-[10px] text-text-dim">1RM</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-dim mt-3">Fórmula de Epley · apenas para séries de 1–12 reps com peso</p>
              </div>
            )}

            {/* Rest recommendation */}
            <div className="rounded-xl bg-bg-card border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-accent-yellow" />
                <p className="text-sm font-semibold text-text-primary">Dicas para Hipertrofia</p>
              </div>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li className="flex items-start gap-2"><span className="text-accent-purple mt-0.5">•</span>Descanso entre séries: <strong className="text-text-primary">90–120 segundos</strong> para maximizar síntese proteica</li>
                <li className="flex items-start gap-2"><span className="text-accent-purple mt-0.5">•</span>Faixa de repetições ideal: <strong className="text-text-primary">6–12 reps</strong> por série (força + volume)</li>
                <li className="flex items-start gap-2"><span className="text-accent-purple mt-0.5">•</span>Sobrecarga progressiva: aumente <strong className="text-text-primary">2,5–5% de peso</strong> a cada semana</li>
                <li className="flex items-start gap-2"><span className="text-accent-purple mt-0.5">•</span>Frequência por músculo: treine cada grupo <strong className="text-text-primary">2× por semana</strong></li>
                <li className="flex items-start gap-2"><span className="text-accent-purple mt-0.5">•</span>Proteína: consuma <strong className="text-text-primary">1,6–2,2g/kg</strong> de peso corporal por dia</li>
              </ul>
            </div>

            {logs.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-text-secondary">Nenhum treino registrado ainda</p>
                <p className="text-xs text-text-dim mt-1">Registre seus exercícios para ver estatísticas</p>
              </div>
            )}
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

  // Estimated 1RM (Epley) from the best qualifying set
  const est1RM = log.sets
    .filter((s) => s.weight && s.weight > 0 && s.reps >= 1 && s.reps <= 12)
    .reduce((best, s) => {
      const est = Math.round(s.weight! * (1 + s.reps / 30));
      return est > best ? est : best;
    }, 0);

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
          <p className="text-xs text-text-dim">{MUSCLE_LABEL(log.muscleGroup)} · {log.sets.length} séries · {totalReps} reps{totalVolume > 0 ? ` · ${totalVolume}kg` : ''}{est1RM > 0 ? ` · 1RM ~${est1RM}kg` : ''}</p>
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
