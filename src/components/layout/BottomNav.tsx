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
  { href: '/chat', icon: MessageSquare, label: 'Sistema', tutorial: 'nav-chat' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', tutorial: 'nav-dashboard' },
  { href: '/tasks', icon: ListTodo, label: 'Tarefas', tutorial: 'nav-tasks' },
  { href: '/exercises', icon: Dumbbell, label: 'Treinos', tutorial: 'nav-exercises' },
  { href: '/projects', icon: FolderKanban, label: 'Projetos', tutorial: 'nav-projects' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-50 border-t border-white/[0.04] bg-bg-secondary/80 backdrop-blur-xl"
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              data-sound={isActive ? 'none' : 'nav'}
              data-tutorial={tab.tutorial}
              className={`relative flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-accent-purple-light'
                  : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-accent-purple/10" />
              )}
              <tab.icon
                size={20}
                className={`relative z-10 ${isActive ? 'drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]' : ''}`}
              />
              <span className="relative z-10 text-[9px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
