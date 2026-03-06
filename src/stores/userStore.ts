import { create } from 'zustand';
import type { UserProfile, UserLevel, UserAttributes } from '@/lib/types';
import { updateUserLevel, setSession } from '@/lib/db/queries';

// ============================================================
// CÁLCULOS DE XP E NÍVEL
// ============================================================

function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

interface UserState {
  userId: string | null;
  token: string | null;
  profile: UserProfile | null;
  level: UserLevel;
  hasCompletedOnboarding: boolean;

  // Actions
  login: (userId: string, token: string, profile: UserProfile, levelData: UserLevel) => void;
  logout: () => void;
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

export const useUserStore = create<UserState>()((set, get) => ({
      userId: null,
      token: null,
      profile: null,
      level: { ...defaultLevel },
      hasCompletedOnboarding: false,

      login: (userId, token, profile, levelData) => {
        setSession(userId, token);
        set({ userId, token, profile, level: levelData, hasCompletedOnboarding: true });
      },

      logout: () => {
        setSession(null, null);
        set({ userId: null, token: null, profile: null, level: { ...defaultLevel }, hasCompletedOnboarding: false });
      },

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

          if (attribute) {
            attributes = { ...attributes, [attribute]: attributes[attribute] + 1 };
          }

          while (xp >= xpToNext) {
            xp -= xpToNext;
            level += 1;
            xpToNext = xpForLevel(level);
          }

          const newLevel = { level, xp, xpToNext, totalXp, attributes };

          // Sincroniza com o banco em segundo plano
          const { userId } = get();
          if (userId) {
            updateUserLevel(userId, newLevel).catch(() => {});
          }

          return { level: newLevel };
        }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      reset: () => {
        setSession(null, null);
        set({ userId: null, token: null, profile: null, level: { ...defaultLevel }, hasCompletedOnboarding: false });
      },
    }));
