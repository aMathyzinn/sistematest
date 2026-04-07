'use client';

import TaskList from '@/components/tasks/TaskList';

export default function TasksPage() {
  return (
    <div className="px-4 py-3 space-y-3">
      <h2 className="text-base font-bold text-text-primary">Tarefas</h2>
      <TaskList />
    </div>
  );
}
