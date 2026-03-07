'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#0a0a0f', display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '24px' }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>⚠️</p>
          <h2 style={{ color: '#f8f8f2', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Algo deu errado
          </h2>
          <p style={{ color: '#a0a0b0', fontSize: 14, marginBottom: 24 }}>
            {error.message || 'Ocorreu um erro inesperado.'}
          </p>
          <button
            onClick={reset}
            style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
