'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { hasCompletedOnboarding } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const timer = setTimeout(() => {
      if (hasCompletedOnboarding) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [mounted, hasCompletedOnboarding, router]);

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
