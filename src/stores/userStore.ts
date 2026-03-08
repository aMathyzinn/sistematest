import { create } from 'zustand';
import type { UserProfile, UserLevel, UserAttributes } from '@/lib/types';
import { updateUserLevel, setSession } from '@/lib/db/queries';

// ============================================================
// CÁLCULOS DE XP E NÍVEL
// ============================================================

function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// ============================================================
// DISPLAY CACHE — localStorage fast-hydration
// On F5, reads the last-known profile/level so the UI shows the
// correct name and XP bar immediately, without waiting for the
// SessionProvider DB round-trip (which takes 300ms–2s).
// The cookie still handles actual auth; this is UI-only.
// ============================================================

const CACHE_KEY = 'sistema-user-v1';

type UserCache = { userId: string; token: string; profile: UserProfile; level: UserLevel };

function readUserCache(): UserCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserCache) : null;
  } catch {
    return null;
  }
}

function writeUserCache(data: UserCache): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* quota / private mode */ }
}

function clearUserCache(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

// Read synchronously at module init (runs before React renders on the client).
const _cache = readUserCache();

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
      userId: _cache?.userId ?? null,
      token: _cache?.token ?? null,
      profile: _cache?.profile ?? null,
      level: _cache?.level ?? { ...defaultLevel },
      hasCompletedOnboarding: !!_cache?.userId,

      login: (userId, token, profile, levelData) => {
        setSession(userId, token);
        writeUserCache({ userId, token, profile, level: levelData });
        set({ userId, token, profile, level: levelData, hasCompletedOnboarding: true });
      },

      logout: () => {
        setSession(null, null);
        clearUserCache();
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
          const { userId, token, profile } = get();
          if (userId) {
            updateUserLevel(userId, newLevel).catch(() => {});
            // Keep display cache in sync with new XP
            if (profile) writeUserCache({ userId, token: token!, profile, level: newLevel });
          }

          return { level: newLevel };
        }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      reset: () => {
        setSession(null, null);
        clearUserCache();
        set({ userId: null, token: null, profile: null, level: { ...defaultLevel }, hasCompletedOnboarding: false });
      },
    }));
