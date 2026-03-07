'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg-primary p-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-red/10 border border-accent-red/30">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-text-primary">Algo deu errado</h2>
          <p className="text-sm text-text-secondary">
            {error.message || 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-accent-purple px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-purple/80 transition-colors"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="rounded-xl border border-border bg-bg-card px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Início
          </button>
        </div>
      </div>
    </div>
  );
}
