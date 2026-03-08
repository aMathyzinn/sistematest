import { create } from 'zustand';
import type { UISection, AppView } from '@/lib/types';
import { upsertUserUISettings, type UserUISettings } from '@/lib/db/queries';

// ============================================================
// STORE DE UI DINÂMICA
// ============================================================

interface UIState {
  currentView: AppView;
  sections: UISection[];
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  /** Set true by pages that take over the full screen (e.g. chat channel view) */
  hideAppShell: boolean;

  // Actions
  init: (uiSettings: UserUISettings) => void;
  setView: (view: AppView) => void;
  setHideAppShell: (hide: boolean) => void;
  setSections: (sections: UISection[]) => void;
  addSection: (section: UISection) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<UISection>) => void;
  reorderSections: (sections: UISection[]) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

function syncUI(theme: 'dark' | 'light', sections: UISection[]) {
  upsertUserUISettings({ theme, sections }).catch(() => {});
}

const defaultSections: UISection[] = [
  { id: 'xp-summary', title: 'Nível & XP', type: 'xp_summary', order: 0, visible: true },
  { id: 'missions-today', title: 'Missões de Hoje', type: 'missions_today', order: 1, visible: true },
  { id: 'tasks-preview', title: 'Tarefas', type: 'tasks_preview', order: 2, visible: true },
  { id: 'pomodoro-widget', title: 'Pomodoro', type: 'pomodoro_widget', order: 3, visible: true },
  { id: 'routine-today', title: 'Rotina', type: 'routine_today', order: 4, visible: true },
];

export const useUIStore = create<UIState>()((set, get) => ({
  currentView: 'dashboard',
  sections: [...defaultSections],
  theme: 'dark',
  sidebarOpen: false,
  hideAppShell: false,

  init: (uiSettings) => set({
    theme: uiSettings.theme,
    sections: uiSettings.sections.length > 0 ? uiSettings.sections : [...defaultSections],
  }),

  setView: (view) => set({ currentView: view }),
  setHideAppShell: (hide) => set({ hideAppShell: hide }),

  setSections: (sections) => {
    set({ sections });
    syncUI(get().theme, sections);
  },

  addSection: (section) => {
    const sections = [...get().sections, section];
    set({ sections });
    syncUI(get().theme, sections);
  },

  removeSection: (id) => {
    const sections = get().sections.filter((s) => s.id !== id);
    set({ sections });
    syncUI(get().theme, sections);
  },

  updateSection: (id, updates) => {
    const sections = get().sections.map((s) => s.id === id ? { ...s, ...updates } : s);
    set({ sections });
    syncUI(get().theme, sections);
  },

  reorderSections: (sections) => {
    set({ sections });
    syncUI(get().theme, sections);
  },

  toggleTheme: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme });
    syncUI(theme, get().sections);
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
