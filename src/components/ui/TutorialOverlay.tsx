'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
  type Transition,
} from 'framer-motion';
import {
  Sparkles,
  MessageSquare,
  LayoutDashboard,
  ListTodo,
  Dumbbell,
  FolderKanban,
  Zap,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useSettingsStore } from '@/stores/settingsStore';

// ============================================================
// STEP DEFINITIONS
// ============================================================

interface Step {
  id: string;
  type: 'fullscreen' | 'spotlight';
  target?: string;
  cardPlacement?: 'above' | 'below';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColorClass: string;
  iconBgClass: string;
  accentColor: string;
  glowColor: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    type: 'fullscreen',
    icon: Sparkles,
    iconColorClass: 'text-accent-purple-light',
    iconBgClass: 'bg-accent-purple/20 border-accent-purple/30',
    accentColor: '#a78bfa',
    glowColor: 'rgba(167,139,250,0.35)',
    title: 'Bem-vindo ao Sistema!',
    description:
      'Seu sistema de evolução pessoal está ativo. Vou te mostrar tudo o que você pode fazer aqui.',
  },
  {
    id: 'chat',
    type: 'spotlight',
    target: '[data-tutorial="nav-chat"]',
    cardPlacement: 'above',
    icon: MessageSquare,
    iconColorClass: 'text-accent-cyan',
    iconBgClass: 'bg-accent-cyan/20 border-accent-cyan/30',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.35)',
    title: 'Sistema IA',
    description:
      'Seu assistente pessoal. Converse, peça análises, planeje seu dia — a IA conhece toda a sua evolução e te ajuda a crescer.',
  },
  {
    id: 'dashboard',
    type: 'spotlight',
    target: '[data-tutorial="nav-dashboard"]',
    cardPlacement: 'above',
    icon: LayoutDashboard,
    iconColorClass: 'text-accent-purple-light',
    iconBgClass: 'bg-accent-purple/20 border-accent-purple/30',
    accentColor: '#a78bfa',
    glowColor: 'rgba(167,139,250,0.35)',
    title: 'Dashboard',
    description:
      'Sua central de comando. Widgets de XP, missões do dia, tarefas pendentes e rotina — tudo em um só lugar.',
  },
  {
    id: 'tasks',
    type: 'spotlight',
    target: '[data-tutorial="nav-tasks"]',
    cardPlacement: 'above',
    icon: ListTodo,
    iconColorClass: 'text-accent-green',
    iconBgClass: 'bg-accent-green/20 border-accent-green/30',
    accentColor: '#10b981',
    glowColor: 'rgba(16,185,129,0.35)',
    title: 'Tarefas',
    description:
      'Crie e organize suas tarefas por prioridade. Cada tarefa concluída rende XP e evolui seus atributos.',
  },
  {
    id: 'exercises',
    type: 'spotlight',
    target: '[data-tutorial="nav-exercises"]',
    cardPlacement: 'above',
    icon: Dumbbell,
    iconColorClass: 'text-accent-orange',
    iconBgClass: 'bg-accent-orange/20 border-accent-orange/30',
    accentColor: '#f97316',
    glowColor: 'rgba(249,115,22,0.35)',
    title: 'Treinos',
    description:
      'Registre seus treinos, acompanhe séries e repetições. Sua evolução física faz parte da sua jornada.',
  },
  {
    id: 'projects',
    type: 'spotlight',
    target: '[data-tutorial="nav-projects"]',
    cardPlacement: 'above',
    icon: FolderKanban,
    iconColorClass: 'text-accent-blue-light',
    iconBgClass: 'bg-accent-blue/20 border-accent-blue/30',
    accentColor: '#60a5fa',
    glowColor: 'rgba(96,165,250,0.35)',
    title: 'Projetos',
    description:
      'Organize seus projetos em quadros Kanban. Da ideia à entrega, tudo mapeado e acompanhado.',
  },
  {
    id: 'xp',
    type: 'spotlight',
    target: '[data-tutorial="level-badge"]',
    cardPlacement: 'below',
    icon: Zap,
    iconColorClass: 'text-accent-yellow',
    iconBgClass: 'bg-accent-yellow/20 border-accent-yellow/30',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.35)',
    title: 'Sua Evolução',
    description:
      'Complete tarefas e missões para ganhar XP e subir de nível. Evolua seus atributos: disciplina, foco, consistência, força e conhecimento.',
  },
  {
    id: 'finish',
    type: 'fullscreen',
    icon: Rocket,
    iconColorClass: 'text-accent-green',
    iconBgClass: 'bg-accent-green/20 border-accent-green/30',
    accentColor: '#10b981',
    glowColor: 'rgba(16,185,129,0.35)',
    title: 'Tudo pronto!',
    description:
      'Sua jornada começa agora. Use o Sistema IA para explorar todas as funcionalidades e acelerar sua evolução. Bora crescer!',
  },
];

// ============================================================
// CARD ANIMATIONS
// ============================================================

const enterTransition: Transition = { duration: 0.42, ease: 'circOut' };
const exitTransition: Transition  = { duration: 0.25, ease: 'easeIn' };

const cardVariants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? 24 : -24,
    scale: 0.93,
  }),
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: enterTransition,
  },
  exit: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? -20 : 20,
    scale: 0.95,
    transition: exitTransition,
  }),
};

// ============================================================
// MAIN COMPONENT
// ============================================================

interface Props {
  onComplete: () => void;
}

export default function TutorialOverlay({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const { profile } = useUserStore();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  // ── Spring-animated spotlight position ────────────────────
  const msX = useMotionValue(0);
  const msY = useMotionValue(0);
  const msR = useMotionValue(0);

  const sX = useSpring(msX, { stiffness: 260, damping: 26 });
  const sY = useSpring(msY, { stiffness: 260, damping: 26 });
  const sR = useSpring(msR, { stiffness: 260, damping: 26 });

  // The overlay gradient reacts to spring values every frame
  const overlayBg = useTransform([sX, sY, sR], ([cx, cy, r]: number[]) => {
    if (r < 3) return 'rgba(10,10,15,0.96)';
    const inner = Math.max(0, r - 6);
    return `radial-gradient(circle ${r}px at ${cx}px ${cy}px, transparent 0%, transparent ${inner}px, rgba(10,10,15,0.94) ${r + 22}px)`;
  });

  // ── Spotlight ring animated position ──────────────────────
  const ringX = useSpring(msX, { stiffness: 260, damping: 26 });
  const ringY = useSpring(msY, { stiffness: 260, damping: 26 });
  const ringR = useSpring(msR, { stiffness: 260, damping: 26 });

  const ringLeft = useTransform(ringX, (x) => x - (spotRect ? spotRect.width / 2 + 14 : 40));
  const ringTop  = useTransform(ringY, (y) => y - (spotRect ? spotRect.height / 2 + 14 : 40));
  const ringW    = useTransform(ringR, (r) => r * 2 - 4);
  const ringH    = useTransform(ringR, (r) => r * 2 - 4);

  // ── Find and track spotlight target ───────────────────────
  const updateRect = useCallback(() => {
    if (current.type !== 'spotlight' || !current.target) {
      setSpotRect(null);
      msR.set(0);
      return;
    }
    const el = document.querySelector(current.target) as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSpotRect(rect);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r  = Math.max(rect.width, rect.height) / 2 + 28;
    msX.set(cx);
    msY.set(cy);
    msR.set(r);
  }, [current, msX, msY, msR]);

  useEffect(() => {
    // Small delay so layout is settled after step change
    const t = setTimeout(updateRect, 60);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateRect);
    };
  }, [updateRect]);

  // Reset to fullscreen look between steps
  useEffect(() => {
    if (current.type === 'fullscreen') msR.set(0);
  }, [step, current.type, msR]);

  useEffect(() => { setMounted(true); }, []);

  // ── Navigation ─────────────────────────────────────────────
  const goNext = () => {
    if (isLast) { onComplete(); return; }
    setDir(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    if (isFirst) return;
    setDir(-1);
    setStep((s) => s - 1);
  };

  if (!mounted) return null;

  // ── Card position for spotlight steps ─────────────────────
  const cardBottomFromViewport = spotRect && current.cardPlacement === 'above'
    ? window.innerHeight - spotRect.top + 20
    : undefined;
  const cardTopFromViewport = spotRect && current.cardPlacement === 'below'
    ? spotRect.bottom + 20
    : undefined;

  // ── Render ─────────────────────────────────────────────────
  return createPortal(
    <>
      {/* ── Dark/spotlight overlay ── */}
      <motion.div
        className="fixed inset-0 z-[9990] pointer-events-auto"
        style={{ background: overlayBg }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      />

      {/* ── Backdrop blur layer (fullscreen steps only) ── */}
      <AnimatePresence>
        {current.type === 'fullscreen' && (
          <motion.div
            key="blur-layer"
            className="fixed inset-0 z-[9991] pointer-events-none"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* ── Spotlight ring ── */}
      <AnimatePresence>
        {current.type === 'spotlight' && spotRect && (
          <motion.div
            key={`ring-${step}`}
            className="fixed z-[9992] pointer-events-none rounded-2xl"
            style={{
              left: ringLeft,
              top: ringTop,
              width: ringW,
              height: ringH,
              border: `2px solid ${current.accentColor}`,
              boxShadow: `0 0 0 1px ${current.accentColor}22, 0 0 28px ${current.glowColor}, inset 0 0 16px ${current.glowColor}`,
            }}
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ── UI chrome: progress dots + skip ── */}
      <div className="fixed inset-x-0 top-0 z-[9995] pointer-events-auto flex items-center justify-between px-4 pt-safe pt-4">
        {/* Progress dots */}
        <motion.div
          className="flex gap-1.5 items-center"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 20 : 6,
                backgroundColor: i === step
                  ? current.accentColor
                  : i < step
                  ? '#4b5563'
                  : '#1e293b',
              }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </motion.div>

        {/* Skip */}
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onComplete}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-text-dim border border-border/50 bg-bg-card/70 backdrop-blur-sm hover:text-text-secondary transition-colors"
        >
          <X size={11} />
          Pular
        </motion.button>
      </div>

      {/* ── Info card ── */}
      {current.type === 'fullscreen' ? (
        /* Fullscreen card — centered */
        <div className="fixed inset-0 z-[9996] flex items-center justify-center px-5 pointer-events-none">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={`card-${step}`}
              custom={dir}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm pointer-events-auto"
            >
              <FullscreenCard
                step={current}
                isFirst={isFirst}
                isLast={isLast}
                profileName={profile?.name}
                onNext={goNext}
                onPrev={goPrev}
                stepIndex={step}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* Spotlight card — positioned near target */
        <div
          className="fixed inset-x-0 z-[9996] flex justify-center px-4 pointer-events-none"
          style={{
            ...(cardBottomFromViewport !== undefined
              ? { bottom: cardBottomFromViewport }
              : { top: cardTopFromViewport }),
          }}
        >
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={`card-${step}`}
              custom={dir}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm pointer-events-auto"
            >
              <SpotlightCard
                step={current}
                isFirst={isFirst}
                isLast={isLast}
                onNext={goNext}
                onPrev={goPrev}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>,
    document.body
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function FullscreenCard({
  step,
  isFirst,
  isLast,
  profileName,
  onNext,
  onPrev,
  stepIndex,
}: {
  step: Step;
  isFirst: boolean;
  isLast: boolean;
  profileName?: string;
  onNext: () => void;
  onPrev: () => void;
  stepIndex: number;
}) {
  const title =
    stepIndex === 0 && profileName
      ? `Bem-vindo, ${profileName}!`
      : step.title;

  return (
    <div
      className="rounded-2xl border border-border bg-bg-card/90 p-6 shadow-2xl text-center space-y-5"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        className="mx-auto"
      >
        <div
          className={`relative mx-auto w-20 h-20 flex items-center justify-center rounded-2xl border ${step.iconBgClass}`}
          style={{ boxShadow: `0 0 36px ${step.glowColor}` }}
        >
          {/* Orbiting dots */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
              style={{ backgroundColor: step.accentColor, opacity: 0.7 }}
            />
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: step.accentColor, opacity: 0.5 }}
            />
          </motion.div>
          <step.icon size={36} className={step.iconColorClass} />
        </div>
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
      </div>

      <div className="flex gap-3">
        {!isFirst && (
          <button
            onClick={onPrev}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all"
          >
            <ChevronLeft size={15} />
            Voltar
          </button>
        )}
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{
            background: `linear-gradient(135deg, ${step.accentColor}dd, ${step.accentColor}99)`,
            boxShadow: `0 8px 24px ${step.glowColor}`,
          }}
        >
          {isLast ? (
            <>
              <Rocket size={16} />
              Começar a jornada
            </>
          ) : (
            <>
              Próximo
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SpotlightCard({
  step,
  isFirst,
  isLast,
  onNext,
  onPrev,
}: {
  step: Step;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-bg-card/95 p-5 shadow-2xl"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: `color-mix(in srgb, ${step.accentColor} 25%, var(--border-color))`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${step.accentColor}18`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${step.iconBgClass}`}
          style={{ boxShadow: `0 0 16px ${step.glowColor}` }}
        >
          <step.icon size={20} className={step.iconColorClass} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary">{step.title}</h3>
          <div
            className="mt-0.5 h-0.5 w-8 rounded-full"
            style={{ backgroundColor: step.accentColor }}
          />
        </div>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-4">{step.description}</p>

      {/* Tip indicator */}
      <div className="flex items-center gap-1.5 mb-4">
        <div className="h-px flex-1" style={{ backgroundColor: `${step.accentColor}30` }} />
        <span className="text-[10px] font-medium" style={{ color: step.accentColor }}>
          TOQUE PARA EXPLORAR
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: `${step.accentColor}30` }} />
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        {!isFirst && (
          <button
            onClick={onPrev}
            className="flex items-center justify-center gap-1 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all"
          >
            <ChevronLeft size={14} />
            Voltar
          </button>
        )}
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{
            background: `linear-gradient(135deg, ${step.accentColor}ee, ${step.accentColor}88)`,
            boxShadow: `0 4px 16px ${step.glowColor}`,
          }}
        >
          {isLast ? 'Concluir' : 'Próximo'}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
