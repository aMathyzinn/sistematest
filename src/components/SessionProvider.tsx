'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import { setCurrentUserId, getUserByToken } from '@/lib/db/queries';
import { queueOrPlayVoice } from '@/lib/audio';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { userId, token, logout } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const greetedRef = useRef(false);

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

    // Validate that this user still exists in Supabase
    getUserByToken(token).then((account) => {
      if (!account) {
        logout();
        setCurrentUserId(null);
        router.replace('/onboarding');
      } else {
        setCurrentUserId(account.id);
        // Queue afternoon greeting — plays on first user interaction
        if (!greetedRef.current) {
          greetedRef.current = true;
          const hour = new Date().getHours();
          if (hour >= 12 && hour < 18) {
            queueOrPlayVoice('/audios/boa_tarde.mp3');
          }
        }
      }
    }).catch(() => {
      // Network error — keep session alive
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
