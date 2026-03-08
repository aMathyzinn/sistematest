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
  hasSeenTutorial: boolean;

  // Actions
  initAll: (apiKey: string, settings: UserSettings) => void;
  setApiKey: (key: string) => void;
  setAiModel: (model: string) => void;
  updatePomodoro: (settings: Partial<PomodoroSettings>) => void;
  setNotifications: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setLanguage: (lang: 'pt-BR' | 'en') => void;
  setHasSeenTutorial: (seen: boolean) => void;
}

// ============================================================
// DISPLAY CACHE — localStorage fast-hydration for settings
// apiKey especially critical: without it the AI chat fails on F5
// until the DB round-trip completes.
// ============================================================

const SETTINGS_CACHE_KEY = 'sistema-settings-v1';

type SettingsCache = {
  apiKey: string;
  aiModel: string;
  pomodoro: PomodoroSettings;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;
  hasSeenTutorial: boolean;
};

function readSettingsCache(): SettingsCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as SettingsCache) : null;
  } catch {
    return null;
  }
}

function writeSettingsCache(data: SettingsCache): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data)); } catch { /* quota / private mode */ }
}

const _sCache = readSettingsCache();

function buildSettings(s: SettingsState): UserSettings {
  return {
    aiModel: s.aiModel,
    pomodoro: s.pomodoro,
    soundEnabled: s.soundEnabled,
    notificationsEnabled: s.notificationsEnabled,
    language: s.language,
    hasSeenTutorial: s.hasSeenTutorial,
  };
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  apiKey: _sCache?.apiKey ?? '',
  aiModel: _sCache?.aiModel ?? 'openai/gpt-4o-mini',
  pomodoro: _sCache?.pomodoro ?? {
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  notificationsEnabled: _sCache?.notificationsEnabled ?? false,
  soundEnabled: _sCache?.soundEnabled ?? true,
  language: (_sCache?.language as 'pt-BR' | 'en') ?? 'pt-BR',
  hasSeenTutorial: _sCache?.hasSeenTutorial ?? false,

  initAll: (apiKey, settings) => {
    const newState = {
      apiKey,
      aiModel: settings.aiModel,
      pomodoro: settings.pomodoro,
      soundEnabled: settings.soundEnabled,
      notificationsEnabled: settings.notificationsEnabled,
      language: settings.language as 'pt-BR' | 'en',
      hasSeenTutorial: settings.hasSeenTutorial ?? false,
    };
    set(newState);
    // Keep the display cache up to date with authoritative DB values
    writeSettingsCache(newState);
  },

  setApiKey: (key) => {
    set({ apiKey: key });
    writeSettingsCache({ ...get(), apiKey: key });
  },

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

  setHasSeenTutorial: (seen) => {
    set({ hasSeenTutorial: seen });
    upsertUserSettings(buildSettings({ ...get(), hasSeenTutorial: seen })).catch(() => {});
  },
}));
