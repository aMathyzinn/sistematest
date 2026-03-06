import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UISection, AppView } from '@/lib/types';

// ============================================================
// STORE DE UI DINÂMICA
// ============================================================

interface UIState {
  currentView: AppView;
  sections: UISection[];
  theme: 'dark' | 'light';
  sidebarOpen: boolean;

  // Actions
  setView: (view: AppView) => void;
  setSections: (sections: UISection[]) => void;
  addSection: (section: UISection) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<UISection>) => void;
  reorderSections: (sections: UISection[]) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

const defaultSections: UISection[] = [
  { id: 'xp-summary', title: 'Nível & XP', type: 'xp_summary', order: 0, visible: true },
  { id: 'missions-today', title: 'Missões de Hoje', type: 'missions_today', order: 1, visible: true },
  { id: 'tasks-preview', title: 'Tarefas', type: 'tasks_preview', order: 2, visible: true },
  { id: 'pomodoro-widget', title: 'Pomodoro', type: 'pomodoro_widget', order: 3, visible: true },
  { id: 'routine-today', title: 'Rotina', type: 'routine_today', order: 4, visible: true },
];

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentView: 'dashboard',
      sections: [...defaultSections],
      theme: 'dark',
      sidebarOpen: false,

      setView: (view) => set({ currentView: view }),

      setSections: (sections) => set({ sections }),

      addSection: (section) =>
        set((state) => ({
          sections: [...state.sections, section],
        })),

      removeSection: (id) =>
        set((state) => ({
          sections: state.sections.filter((s) => s.id !== id),
        })),

      updateSection: (id, updates) =>
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      reorderSections: (sections) => set({ sections }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'sistema-ui',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
