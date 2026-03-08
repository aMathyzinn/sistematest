'use client';

import { useState, useEffect } from 'react';
import * as db from '@/lib/db/queries';
import type { Project, ProjectTask, ProjectStatus } from '@/lib/types';
import { Plus, Trash2, FolderKanban, X, Check, ChevronDown, Circle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Ativo',      color: 'text-accent-green',  bg: 'bg-accent-green/10' },
  paused:    { label: 'Pausado',    color: 'text-accent-yellow', bg: 'bg-accent-yellow/10' },
  completed: { label: 'Concluído', color: 'text-accent-blue',   bg: 'bg-accent-blue/10' },
  cancelled: { label: 'Cancelado', color: 'text-accent-red',    bg: 'bg-accent-red/10' },
};

type Tab = 'ativos' | 'todos';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tab, setTab] = useState<Tab>('ativos');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [formTasks, setFormTasks] = useState<string[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await db.getAllProjects();
      setProjects(data);
    } catch {
      // DB não pronta
    }
  };

  const addFormTask = () => {
    if (!newTaskInput.trim()) return;
    setFormTasks([...formTasks, newTaskInput.trim()]);
    setNewTaskInput('');
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await db.addProject({
        title: title.trim(),
        description: desc.trim() || undefined,
        status: 'active',
        deadline: deadline || undefined,
        progress: 0,
        tasks: formTasks.map((t) => ({ id: uuidv4(), title: t, done: false })),
      });
      setTitle('');
      setDesc('');
      setDeadline('');
      setFormTasks([]);
      setNewTaskInput('');
      setShowForm(false);
      await loadProjects();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar este projeto?')) return;
    await db.deleteProject(id);
    await loadProjects();
  };

  const toggleTask = async (project: Project, taskId: string) => {
    const newTasks = project.tasks.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    const progress = Math.round((newTasks.filter((t) => t.done).length / newTasks.length) * 100);
    await db.updateProject(project.id, { tasks: newTasks, progress });
    await loadProjects();
  };

  const changeStatus = async (project: Project, status: ProjectStatus) => {
    await db.updateProject(project.id, {
      status,
      progress: status === 'completed' ? 100 : project.progress,
    });
    await loadProjects();
  };

  const filtered = tab === 'ativos'
    ? projects.filter((p) => p.status === 'active' || p.status === 'paused')
    : projects;

  return (
    <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban size={20} className="text-accent-purple-light" />
            <h2 className="text-lg font-bold text-text-primary">Projetos</h2>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-accent-purple/10 border border-accent-purple/30 px-3 py-1.5 text-xs font-medium text-accent-purple-light hover:bg-accent-purple/20 transition-colors"
          >
            <Plus size={14} /> Novo Projeto
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 rounded-xl bg-bg-secondary p-1">
          {(['ativos', 'todos'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all capitalize ${
                tab === t ? 'bg-accent-purple text-white shadow' : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {t === 'ativos' ? 'Ativos' : 'Todos'}
            </button>
          ))}
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl bg-bg-card border border-border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Novo Projeto</p>
                <button onClick={() => setShowForm(false)} className="text-text-dim hover:text-text-primary">
                  <X size={16} />
                </button>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do projeto"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none"
              />
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none"
              />
              <div>
                <label className="text-xs text-text-dim">Prazo</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
                />
              </div>

              {/* Tarefas iniciais */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-secondary">Tarefas</p>
                {formTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                    <Check size={12} className="text-accent-green shrink-0" />
                    <span className="flex-1">{t}</span>
                    <button
                      onClick={() => setFormTasks(formTasks.filter((_, idx) => idx !== i))}
                      className="text-text-dim hover:text-accent-red"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addFormTask()}
                    placeholder="Adicionar tarefa..."
                    className="flex-1 rounded-lg border border-border bg-bg-tertiary px-3 py-1.5 text-xs text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none"
                  />
                  <button
                    onClick={addFormTask}
                    className="rounded-lg bg-accent-purple/10 border border-accent-purple/30 px-2 text-accent-purple-light hover:bg-accent-purple/20"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className="w-full rounded-lg bg-accent-purple py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {saving ? 'Criando...' : 'Criar Projeto'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple/10 text-3xl">
                🗂️
              </div>
              <p className="text-sm text-text-secondary">Nenhum projeto aqui</p>
              <p className="text-xs text-text-dim mt-1">Crie um novo projeto acima</p>
            </div>
          )}
          {filtered.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              expanded={expandedId === project.id}
              onToggleExpand={() => setExpandedId(expandedId === project.id ? null : project.id)}
              onToggleTask={toggleTask}
              onChangeStatus={changeStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
  );
}

function ProjectCard({
  project,
  index,
  expanded,
  onToggleExpand,
  onToggleTask,
  onChangeStatus,
  onDelete,
}: {
  project: Project;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleTask: (p: Project, taskId: string) => void;
  onChangeStatus: (p: Project, status: ProjectStatus) => void;
  onDelete: (id: string) => void;
}) {
  const { label, color, bg } = STATUS_CONFIG[project.status];
  const completed = project.tasks.filter((t) => t.done).length;
  const total = project.tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : project.progress;

  const formatDeadline = (d?: string) => {
    if (!d) return null;
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl bg-bg-card border border-border overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-purple/10 text-lg shrink-0">
          🗂️
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-text-primary">{project.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${bg} ${color}`}>{label}</span>
          </div>
          {project.description && (
            <p className="text-xs text-text-dim mt-0.5 truncate">{project.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {total > 0 && (
              <>
                <div className="flex-1 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-purple transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-dim shrink-0">{completed}/{total}</span>
              </>
            )}
            {project.deadline && (
              <span className="text-[10px] text-text-dim">📅 {formatDeadline(project.deadline)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onDelete(project.id)}
            className="rounded p-1 text-text-dim hover:text-accent-red transition-colors"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onToggleExpand}
            className={`rounded p-1 text-text-dim transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="px-4 py-3 space-y-3">
              {/* Status changer */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => onChangeStatus(project, s)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all ${
                      project.status === s
                        ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ring-1 ring-current`
                        : 'bg-bg-tertiary text-text-dim hover:bg-bg-hover'
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>

              {/* Tasks */}
              {project.tasks.length > 0 && (
                <div className="space-y-1.5">
                  {project.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onToggleTask(project, task.id)}
                      className="flex w-full items-center gap-2 text-left"
                    >
                      {task.done ? (
                        <CheckCircle2 size={14} className="text-accent-green shrink-0" />
                      ) : (
                        <Circle size={14} className="text-text-dim shrink-0" />
                      )}
                      <span className={`text-xs ${task.done ? 'line-through text-text-dim' : 'text-text-secondary'}`}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {project.tasks.length === 0 && (
                <p className="text-xs text-text-dim italic">Sem tarefas. Diga ao Sistema para adicionar!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
