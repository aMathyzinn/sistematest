import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PomodoroSettings } from '@/lib/types';

// ============================================================
// STORE DE CONFIGURAÇÕES
// ============================================================

interface SettingsState {
  apiKey: string;
  aiModel: string;
  pomodoro: PomodoroSettings;
  notificationsEnabled: boolean;
  language: 'pt-BR' | 'en';

  // Actions
  setApiKey: (key: string) => void;
  setAiModel: (model: string) => void;
  updatePomodoro: (settings: Partial<PomodoroSettings>) => void;
  setNotifications: (enabled: boolean) => void;
  setLanguage: (lang: 'pt-BR' | 'en') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
      aiModel: 'openai/gpt-5-mini',
      pomodoro: {
        focusDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
      },
      notificationsEnabled: false,
      language: 'pt-BR',

      setApiKey: (key) => set({ apiKey: key }),
      setAiModel: (model) => set({ aiModel: model }),
      updatePomodoro: (settings) =>
        set((state) => ({
          pomodoro: { ...state.pomodoro, ...settings },
        })),
      setNotifications: (enabled) => set({ notificationsEnabled: enabled }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'sistema-settings',
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
