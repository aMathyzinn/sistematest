import { create } from 'zustand';
import type { PomodoroSettings } from '@/lib/types';
import { upsertUserSettings, type UserSettings } from '@/lib/db/queries';

// ============================================================
// STORE DE CONFIGURAÇÕES
// ============================================================

interface SettingsState {
  apiKey: string;
  aiModel: string;
  pomodoro: PomodoroSettings;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  language: 'pt-BR' | 'en';

  // Actions
  initAll: (apiKey: string, settings: UserSettings) => void;
  setApiKey: (key: string) => void;
  setAiModel: (model: string) => void;
  updatePomodoro: (settings: Partial<PomodoroSettings>) => void;
  setNotifications: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setLanguage: (lang: 'pt-BR' | 'en') => void;
}

function buildSettings(s: SettingsState): UserSettings {
  return {
    aiModel: s.aiModel,
    pomodoro: s.pomodoro,
    soundEnabled: s.soundEnabled,
    notificationsEnabled: s.notificationsEnabled,
    language: s.language,
  };
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
  aiModel: 'openai/gpt-4o-mini',
  pomodoro: {
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  notificationsEnabled: false,
  soundEnabled: true,
  language: 'pt-BR',

  initAll: (apiKey, settings) => set({
    apiKey,
    aiModel: settings.aiModel,
    pomodoro: settings.pomodoro,
    soundEnabled: settings.soundEnabled,
    notificationsEnabled: settings.notificationsEnabled,
    language: settings.language as 'pt-BR' | 'en',
  }),

  setApiKey: (key) => set({ apiKey: key }),

  setAiModel: (model) => {
    set({ aiModel: model });
    upsertUserSettings(buildSettings({ ...get(), aiModel: model })).catch(() => {});
  },

  updatePomodoro: (settings) => {
    const newPomodoro = { ...get().pomodoro, ...settings };
    set({ pomodoro: newPomodoro });
    upsertUserSettings(buildSettings({ ...get(), pomodoro: newPomodoro })).catch(() => {});
  },

  setNotifications: (enabled) => {
    set({ notificationsEnabled: enabled });
    upsertUserSettings(buildSettings({ ...get(), notificationsEnabled: enabled })).catch(() => {});
  },

  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
    upsertUserSettings(buildSettings({ ...get(), soundEnabled: enabled })).catch(() => {});
  },

  setLanguage: (lang) => {
    set({ language: lang });
    upsertUserSettings(buildSettings({ ...get(), language: lang })).catch(() => {});
  },
}));
