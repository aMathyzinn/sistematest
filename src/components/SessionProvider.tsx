'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import { setCurrentUserId, getUserByToken } from '@/lib/db/queries';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { userId, token, logout } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!userId || !token) {
      setCurrentUserId(null);
      if (pathname !== '/onboarding') router.replace('/onboarding');
      return;
    }

    // Validate that this user still exists in Supabase (e.g. schema was re-run)
    getUserByToken(token).then((account) => {
      if (!account) {
        // User no longer exists — clear local session and redirect
        logout();
        setCurrentUserId(null);
        router.replace('/onboarding');
      } else {
        setCurrentUserId(account.id);
      }
    }).catch(() => {
      // Network/DB error — still set the id so queries can run optimistically
      setCurrentUserId(userId);
    });
  }, [userId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
