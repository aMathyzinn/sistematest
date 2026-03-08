'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Volume2,
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { playVoiceFileTracked, setTutorialActive } from '@/lib/audio';
import AudioSpectrum from '@/components/ui/AudioSpectrum';

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
  audioSrc: string;
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
    audioSrc: '/audios/tutorial/boasvindas.mp3',
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
    audioSrc: '/audios/tutorial/ia_sistema.mp3',
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
    audioSrc: '/audios/tutorial/dashboard.mp3',
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
    audioSrc: '/audios/tutorial/tarefas.mp3',
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
    audioSrc: '/audios/tutorial/treinos.mp3',
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
    audioSrc: '/audios/tutorial/projetos.mp3',
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
    audioSrc: '/audios/tutorial/evolution.mp3',
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
    audioSrc: '/audios/tutorial/boasorte.mp3',
  },
];

// ============================================================
// CARD ANIMATIONS
// ============================================================

const enterTransition: Transition = { duration: 0.42, ease: 'circOut' };
const exitTransition: Transition = { duration: 0.25, ease: 'easeIn' };

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

  // ── Audio state ────────────────────────────────────────────
  const [audioReady, setAudioReady] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioElapsed, setAudioElapsed] = useState(0);
  // Generation counter — incremented on step change so stale callbacks
  // from the previous step's audio are silently dropped.
  const audioGenRef = useRef(0);

  const { profile } = useUserStore();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  // Derived: countdown seconds / normalised progress (0→1)
  const countdown = audioReady
    ? 0
    : Math.max(0, Math.ceil(audioDuration - audioElapsed));
  const progress =
    audioDuration > 0
      ? Math.min(audioElapsed / audioDuration, 1)
      : audioReady
      ? 1
      : 0;

  // ── Play audio on every step change ──────────────────────
  useEffect(() => {
    setAudioReady(false);
    setAudioElapsed(0);
    setAudioDuration(0);

    const gen = ++audioGenRef.current;
    let stopFn: (() => void) | null = null;

    playVoiceFileTracked(current.audioSrc).then((result) => {
      if (audioGenRef.current !== gen) return;

      if (!result) {
        // Sound disabled or fetch failed — unlock button immediately
        setAudioReady(true);
        return;
      }

      const { duration, done, stop } = result;
      stopFn = stop;
      setAudioDuration(duration);

      const startTs = Date.now();
      const interval = setInterval(() => {
        if (audioGenRef.current !== gen) { clearInterval(interval); return; }
        setAudioElapsed(Math.min((Date.now() - startTs) / 1000, duration));
      }, 80);

      done.then(() => {
        clearInterval(interval);
        if (audioGenRef.current !== gen) return;
        setAudioElapsed(duration);
        setAudioReady(true);
      });
    });

    // Invalidate the gen counter and stop current audio when step changes or unmounts
    return () => {
      audioGenRef.current++;
      stopFn?.();
    };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Spring-animated spotlight ─────────────────────────────
  const msX = useMotionValue(0);
  const msY = useMotionValue(0);
  const msR = useMotionValue(0);

  const springX = useSpring(msX, { stiffness: 260, damping: 26 });
  const springY = useSpring(msY, { stiffness: 260, damping: 26 });
  const springR = useSpring(msR, { stiffness: 260, damping: 26 });

  // Radial gradient that cuts out a circle around the spotlighted element
  const overlayBg = useTransform(
    [springX, springY, springR],
    ([cx, cy, r]: number[]) => {
      if (r < 3) return 'rgba(10,10,15,0.96)';
      const inner = Math.max(0, r - 6);
      return `radial-gradient(circle ${r}px at ${cx}px ${cy}px, transparent 0%, transparent ${inner}px, rgba(10,10,15,0.94) ${r + 22}px)`;
    },
  );

  const ringLeft = useTransform(
    springX,
    (x) => x - (spotRect ? spotRect.width / 2 + 14 : 40),
  );
  const ringTop = useTransform(
    springY,
    (y) => y - (spotRect ? spotRect.height / 2 + 14 : 40),
  );
  const ringW = useTransform(springR, (r) => r * 2 - 4);
  const ringH = useTransform(springR, (r) => r * 2 - 4);

  // ── Measure & track spotlight target ─────────────────────
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
    msX.set(rect.left + rect.width / 2);
    msY.set(rect.top + rect.height / 2);
    msR.set(Math.max(rect.width, rect.height) / 2 + 28);
  }, [current, msX, msY, msR]);

  useEffect(() => {
    const t = setTimeout(updateRect, 60);
    window.addEventListener('resize', updateRect);
    return () => { clearTimeout(t); window.removeEventListener('resize', updateRect); };
  }, [updateRect]);

  useEffect(() => {
    if (current.type === 'fullscreen') msR.set(0);
  }, [step, current.type, msR]);

  useEffect(() => { setMounted(true); }, []);

  // Block all non-tutorial audio while overlay is alive
  useEffect(() => {
    setTutorialActive(true);
    return () => setTutorialActive(false);
  }, []);

  // ── Navigation ─────────────────────────────────────────────
  const goNext = () => {
    if (!audioReady) return;
    if (isLast) { setTutorialActive(false); onComplete(); return; }
    setDir(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    if (isFirst) return;
    setDir(-1);
    setStep((s) => s - 1);
  };

  if (!mounted) return null;

  const cardBottomFromViewport =
    spotRect && current.cardPlacement === 'above'
      ? window.innerHeight - spotRect.top + 20
      : undefined;
  const cardTopFromViewport =
    spotRect && current.cardPlacement === 'below'
      ? spotRect.bottom + 20
      : undefined;

  const sharedProps = {
    step: current,
    isFirst,
    isLast,
    onNext: goNext,
    onPrev: goPrev,
    audioReady,
    countdown,
    progress,
  };

  // ── Render ─────────────────────────────────────────────────
  return createPortal(
    <>
      {/* Dark / spotlight overlay */}
      <motion.div
        className="fixed inset-0 z-[9990] pointer-events-auto"
        style={{ background: overlayBg }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      />

      {/* Blur layer — fullscreen steps only */}
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

      {/* Spotlight ring */}
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
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* Progress dots + skip */}
      <div className="fixed inset-x-0 top-0 z-[9995] pointer-events-auto flex items-center justify-between px-4 pt-safe pt-4">
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
                backgroundColor:
                  i === step ? current.accentColor : i < step ? '#4b5563' : '#1e293b',
              }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => { setTutorialActive(false); onComplete(); }}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-text-dim border border-border/50 bg-bg-card/70 backdrop-blur-sm hover:text-text-secondary transition-colors"
        >
          <X size={11} />
          Pular
        </motion.button>
      </div>

      {/* Card */}
      {current.type === 'fullscreen' ? (
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
                {...sharedProps}
                profileName={profile?.name}
                stepIndex={step}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
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
              <SpotlightCard {...sharedProps} />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>,
    document.body,
  );
}

// ============================================================
// NEXT BUTTON — shared by both card types
// ============================================================

interface NextButtonProps {
  onClick: () => void;
  isLast: boolean;
  audioReady: boolean;
  countdown: number;
  progress: number;
  accentColor: string;
  glowColor: string;
}

function NextButton({
  onClick,
  isLast,
  audioReady,
  countdown,
  progress,
  accentColor,
  glowColor,
}: NextButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={!audioReady}
      className="relative flex-1 overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:cursor-not-allowed"
      style={{
        background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor}88)`,
        boxShadow: audioReady ? `0 8px 24px ${glowColor}` : 'none',
        opacity: audioReady ? 1 : 0.72,
      }}
    >
      {/* Fill bar that grows left→right as audio plays */}
      {!audioReady && (
        <motion.div
          className="absolute inset-0 origin-left pointer-events-none"
          style={{ backgroundColor: `${accentColor}44` }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.08, ease: 'linear' }}
        />
      )}

      {/* Label */}
      <span className="relative flex items-center justify-center gap-2">
        {!audioReady ? (
          <>
            <Volume2 size={14} className="animate-pulse" />
            <span>{countdown}s</span>
          </>
        ) : isLast ? (
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
      </span>
    </button>
  );
}

// ============================================================
// FULLSCREEN CARD
// ============================================================

interface CardCommonProps {
  step: Step;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  audioReady: boolean;
  countdown: number;
  progress: number;
}

function FullscreenCard({
  step,
  isFirst,
  isLast,
  profileName,
  onNext,
  onPrev,
  stepIndex,
  audioReady,
  countdown,
  progress,
}: CardCommonProps & { profileName?: string; stepIndex: number }) {
  const title =
    stepIndex === 0 && profileName ? `Bem-vindo, ${profileName}!` : step.title;

  return (
    <div
      className="rounded-2xl border border-border bg-bg-card/90 p-6 shadow-2xl text-center space-y-4"
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

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
      </div>

      {/* Audio spectrum */}
      <div
        className="h-12 w-full rounded-xl overflow-hidden"
        style={{ background: `${step.accentColor}0d` }}
      >
        <AudioSpectrum color={step.accentColor} mirror />
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
        <NextButton
          onClick={onNext}
          isLast={isLast}
          audioReady={audioReady}
          countdown={countdown}
          progress={progress}
          accentColor={step.accentColor}
          glowColor={step.glowColor}
        />
      </div>
    </div>
  );
}

// ============================================================
// SPOTLIGHT CARD
// ============================================================

function SpotlightCard({
  step,
  isFirst,
  isLast,
  onNext,
  onPrev,
  audioReady,
  countdown,
  progress,
}: CardCommonProps) {
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
      {/* Header */}
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

      <p className="text-sm text-text-secondary leading-relaxed mb-3">
        {step.description}
      </p>

      {/* Audio spectrum */}
      <div
        className="h-9 w-full rounded-lg overflow-hidden mb-3"
        style={{ background: `${step.accentColor}0d` }}
      >
        <AudioSpectrum color={step.accentColor} mirror />
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
        <NextButton
          onClick={onNext}
          isLast={isLast}
          audioReady={audioReady}
          countdown={countdown}
          progress={progress}
          accentColor={step.accentColor}
          glowColor={step.glowColor}
        />
      </div>
    </div>
  );
}
