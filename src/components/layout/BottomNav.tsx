'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  MessageSquare,
  LayoutDashboard,
  ListTodo,
  Dumbbell,
  FolderKanban,
} from 'lucide-react';

const tabs = [
  { href: '/chat', icon: MessageSquare, label: 'Sistema' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks', icon: ListTodo, label: 'Tarefas' },
  { href: '/exercises', icon: Dumbbell, label: 'Treinos' },
  { href: '/projects', icon: FolderKanban, label: 'Projetos' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-secondary/95 backdrop-blur-lg"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              data-sound={isActive ? 'none' : 'nav'}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200 ${
                isActive
                  ? 'text-accent-purple-light'
                  : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              <tab.icon
                size={22}
                className={isActive ? 'drop-shadow-[0_0_8px_rgba(124,58,237,0.6)]' : ''}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <div className="h-0.5 w-4 rounded-full bg-accent-purple mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
