'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function SystemNavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    if (pathname !== '/' && pathname !== '/dashboard') {
      router.back();
    }
  };

  const handleHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="system-nav shrink-0 flex items-center justify-center gap-16 h-11 select-none z-50">
      {/* Back — triangle */}
      <button
        onClick={handleBack}
        className="p-2.5 text-white/25 active:text-white/50 transition-colors"
        aria-label="Voltar"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>

      {/* Home — circle */}
      <button
        onClick={handleHome}
        className="p-2.5 text-white/25 active:text-white/50 transition-colors"
        aria-label="Home"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="8.5" />
        </svg>
      </button>

      {/* Recents — square */}
      <button
        className="p-2.5 text-white/25 active:text-white/50 transition-colors"
        aria-label="Recentes"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
        </svg>
      </button>
    </div>
  );
}
