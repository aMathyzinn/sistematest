'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { setCurrentUserId } from '@/lib/db/queries';

/**
 * Inicializa o userId no módulo de queries a partir do store persistido no localStorage.
 * Necessário porque _currentUserId é uma variável de módulo que reseta a cada carregamento de página.
 */
export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const userId = useUserStore((s) => s.userId);

  useEffect(() => {
    setCurrentUserId(userId);
  }, [userId]);

  return <>{children}</>;
}
