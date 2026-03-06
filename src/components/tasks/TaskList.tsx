'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Task } from '@/lib/types';
import * as db from '@/lib/db/queries';
import TaskItem from './TaskItem';
import { Plus, Filter } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

interface TaskListProps {
  limit?: number;
  showAdd?: boolean;
  showFilter?: boolean;
}

export default function TaskList({ limit, showAdd = true, showFilter = true }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const loadTasks = useCallback(async () => {
    try {
      let loaded: Task[];
      if (filter === 'all') {
        loaded = await db.getAllTasks();
      } else {
        loaded = await db.getTasksByStatus(filter);
      }
      loaded.sort((a, b) => a.order - b.order);
      if (limit) loaded = loaded.slice(0, limit);
      setTasks(loaded);
    } catch {
      // DB não pronta
    }
  }, [filter, limit]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await db.addTask({
      title: newTitle.trim(),
      category: 'custom',
      priority: 'medium',
      status: 'pending',
      xpReward: 20,
    });
    setNewTitle('');
    setShowAddForm(false);
    loadTasks();
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      {(showFilter || showAdd) && (
        <div className="flex items-center justify-between">
          {showFilter && (
            <div className="flex gap-1">
              {(['pending', 'completed', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-accent-purple/20 text-accent-purple-light'
                      : 'text-text-dim hover:text-text-secondary'
                  }`}
                >
                  {f === 'pending' ? 'Pendentes' : f === 'completed' ? 'Concluídas' : 'Todas'}
                </button>
              ))}
            </div>
          )}
          {showAdd && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 rounded-lg bg-accent-purple/10 px-3 py-1 text-xs font-medium text-accent-purple-light hover:bg-accent-purple/20 transition-colors"
            >
              <Plus size={12} />
              Nova
            </button>
          )}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Nova tarefa..."
            className="flex-1 rounded-xl border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleAdd}
            className="rounded-xl bg-accent-purple px-4 py-2 text-sm font-medium text-white"
          >
            Adicionar
          </button>
        </div>
      )}

      {/* Tasks */}
      <div className="space-y-2">
        <AnimatePresence>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={loadTasks} />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-text-dim">
            {filter === 'pending' ? 'Nenhuma tarefa pendente 🎉' : 'Nenhuma tarefa encontrada'}
          </p>
        )}
      </div>
    </div>
  );
}
