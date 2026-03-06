import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile, UserLevel, UserAttributes } from '@/lib/types';

// ============================================================
// CÁLCULOS DE XP E NÍVEL
// ============================================================

function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

interface UserState {
  profile: UserProfile | null;
  level: UserLevel;
  hasCompletedOnboarding: boolean;

  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addXP: (amount: number, attribute?: keyof UserAttributes) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

const defaultLevel: UserLevel = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  totalXp: 0,
  attributes: {
    discipline: 1,
    focus: 1,
    consistency: 1,
    strength: 1,
    knowledge: 1,
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      level: { ...defaultLevel },
      hasCompletedOnboarding: false,

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),

      addXP: (amount, attribute) =>
        set((state) => {
          let { level, xp, xpToNext, totalXp, attributes } = state.level;
          xp += amount;
          totalXp += amount;

          // Atualizar atributo específico
          if (attribute) {
            attributes = { ...attributes, [attribute]: attributes[attribute] + 1 };
          }

          // Level up
          while (xp >= xpToNext) {
            xp -= xpToNext;
            level += 1;
            xpToNext = xpForLevel(level);
          }

          return {
            level: { level, xp, xpToNext, totalXp, attributes },
          };
        }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      reset: () =>
        set({
          profile: null,
          level: { ...defaultLevel },
          hasCompletedOnboarding: false,
        }),
    }),
    {
      name: 'sistema-user',
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
