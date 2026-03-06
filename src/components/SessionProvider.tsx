'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import { setCurrentUserId, getUserByToken } from '@/lib/db/queries';
import { playVoiceBoaTarde } from '@/lib/audio';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { userId, token, logout } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const greetedRef = useRef(false);

  useEffect(() => {
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
        // Play afternoon greeting once per session
        if (!greetedRef.current) {
          greetedRef.current = true;
          const hour = new Date().getHours();
          if (hour >= 12 && hour < 18) {
            playVoiceBoaTarde();
          }
        }
      }
    }).catch(() => {
      setCurrentUserId(userId);
      if (!greetedRef.current) {
        greetedRef.current = true;
        const hour = new Date().getHours();
        if (hour >= 12 && hour < 18) playVoiceBoaTarde();
      }
    });
  }, [userId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
