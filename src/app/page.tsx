'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionCookie } from '@/lib/db/queries';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read the session cookie synchronously — no network call, no race condition.
    // If a valid session exists go to dashboard, otherwise go to onboarding.
    const session = getSessionCookie();
    router.replace(session ? '/dashboard' : '/onboarding');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg-primary">
      {/* Splash screen */}
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-accent-purple/20 border border-accent-purple/30 animate-pulse-glow">
            <span className="text-4xl font-bold text-accent-purple-light glow-text">S</span>
          </div>
          <Sparkles
            size={20}
            className="absolute -right-2 -top-2 text-accent-yellow animate-bounce"
          />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-wider text-text-primary glow-text">
            SISTEMA
          </h1>
          <p className="text-sm text-text-secondary">
            Sistema de Evolução Pessoal
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-purple animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-accent-purple animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-accent-purple animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
