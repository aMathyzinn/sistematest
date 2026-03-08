'use client';

import TaskList from '@/components/tasks/TaskList';

export default function TasksPage() {
  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold text-text-primary">Tarefas</h2>
      <TaskList />
    </div>
  );
}
