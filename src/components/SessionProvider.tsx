'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { setSession, getSessionCookie, getUserByToken } from '@/lib/db/queries';
import { queueOrPlayVoice } from '@/lib/audio';

// Module-level cache: skip re-validation within 90 s to avoid hammering Supabase
// on rapid navigations or F5 reloads.
let lastValidatedToken = '';
let lastValidatedAt = 0;
const VALIDATION_TTL_MS = 90_000;

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { userId, token, login, logout } = useUserStore();
  const { initAll: initSettings } = useSettingsStore();
  const { init: initUI } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const greetedRef = useRef(false);
  const inFlightRef = useRef(false);

  function playGreetingOnce() {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 18) queueOrPlayVoice('/audios/boa_tarde.mp3');
  }

  useEffect(() => {
    // Source of truth: cookie (works across PWA/browser on mobile).
    // The store may also have values if login() was just called.
    const session = getSessionCookie();
    const tok = token || session?.token || null;
    const uid = userId || session?.userId || null;

    if (!tok || !uid) {
      setSession(null, null);
      if (pathname !== '/onboarding') router.replace('/onboarding');
      return;
    }

    // TTL hit: skip round-trip, stores were already initialised on last validation
    const now = Date.now();
    if (tok === lastValidatedToken && now - lastValidatedAt < VALIDATION_TTL_MS) {
      setSession(uid, tok);
      playGreetingOnce();
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    getUserByToken(tok).then((account) => {
      inFlightRef.current = false;
      if (!account) {
        if (tok !== lastValidatedToken || Date.now() - lastValidatedAt >= VALIDATION_TTL_MS) {
          logout();
          router.replace('/onboarding');
        }
      } else {
        lastValidatedToken = tok;
        lastValidatedAt = Date.now();
        // Hydrate all stores from DB — single source of truth
        login(account.id, account.token, account.profile, account.levelData);
        initSettings(account.apiKey, account.settings);
        initUI(account.uiSettings);
        playGreetingOnce();
      }
    }).catch(() => {
      inFlightRef.current = false;
      // Network error — keep cookie session alive, _currentUserId already set
      setSession(uid, tok);
      playGreetingOnce();
    });
  }, [userId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

