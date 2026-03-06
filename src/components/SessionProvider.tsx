'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import { setCurrentUserId, getUserByToken } from '@/lib/db/queries';
import { queueOrPlayVoice } from '@/lib/audio';

// Module-level guard: skip re-validation if we verified within the last 90 s.
// This prevents rapid F5 reloads from racing getUserByToken and triggering logout.
let lastValidatedToken = '';
let lastValidatedAt = 0;
const VALIDATION_TTL_MS = 90_000;

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { userId, token, logout } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const greetedRef = useRef(false);
  const inFlightRef = useRef(false);

  // Wait for zustand localStorage rehydration before acting on null state.
  // Without this, the brief SSR null values trigger premature redirects.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!userId || !token) {
      setCurrentUserId(null);
      if (pathname !== '/onboarding') router.replace('/onboarding');
      return;
    }

    // Recent successful validation for the same token → skip Supabase round-trip
    const now = Date.now();
    if (token === lastValidatedToken && now - lastValidatedAt < VALIDATION_TTL_MS) {
      setCurrentUserId(userId);
      if (!greetedRef.current) {
        greetedRef.current = true;
        const hour = new Date().getHours();
        if (hour >= 12 && hour < 18) queueOrPlayVoice('/audios/boa_tarde.mp3');
      }
      return;
    }

    // Prevent concurrent in-flight validations (rapid F5 spam)
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // Validate that this user still exists in Supabase
    getUserByToken(token).then((account) => {
      inFlightRef.current = false;
      if (!account) {
        // Only logout if the TTL window has also expired (double-check guard)
        if (token !== lastValidatedToken || Date.now() - lastValidatedAt >= VALIDATION_TTL_MS) {
          logout();
          setCurrentUserId(null);
          router.replace('/onboarding');
        }
      } else {
        lastValidatedToken = token;
        lastValidatedAt = Date.now();
        setCurrentUserId(account.id);
        if (!greetedRef.current) {
          greetedRef.current = true;
          const hour = new Date().getHours();
          if (hour >= 12 && hour < 18) {
            queueOrPlayVoice('/audios/boa_tarde.mp3');
          }
        }
      }
    }).catch(() => {
      inFlightRef.current = false;
      // Network error — keep session alive, trust localStorage
      setCurrentUserId(userId);
      if (!greetedRef.current) {
        greetedRef.current = true;
        const hour = new Date().getHours();
        if (hour >= 12 && hour < 18) queueOrPlayVoice('/audios/boa_tarde.mp3');
      }
    });
  }, [hydrated, userId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
