'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { Bot, User, Swords, Zap, CheckCircle2, Plus, Target, LayoutDashboard, MessageSquarePlus, Clock, Bell, UserCog, Dumbbell, FolderPlus, FolderEdit, ListPlus, Trash2, PenLine, RefreshCw, FolderX, CheckSquare, Calendar, Play, Pause, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const router = useRouter();

  const hasMissionCreated = message.actions?.some((a) => a.type === 'CREATE_MISSION');
  const hasTaskCreated = message.actions?.some((a) => a.type === 'CREATE_TASK');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-accent-purple to-indigo-500 text-white'
            : 'bg-gradient-to-br from-bg-card to-bg-tertiary border border-border text-accent-purple-light'
        }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-accent-purple to-indigo-500 text-white rounded-br-sm'
            : 'bg-bg-card border border-border/60 text-text-primary rounded-bl-sm'
        }`}
      >
        {isUser && message.voiceData ? (
          <VoiceBubble audioUrl={message.voiceData.audioUrl} duration={message.voiceData.duration} />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Actions badges */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.actions.map((action, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isUser
                    ? 'bg-white/20 text-white/90'
                    : 'bg-accent-purple/10 text-accent-purple-light'
                }`}
              >
                <ActionIcon type={action.type} />
                {actionLabel(action.type)}
              </span>
            ))}
          </div>
        )}

        {/* Navigation shortcuts */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {hasMissionCreated && (
            <button
              onClick={() => router.push('/missions')}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isUser
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-accent-orange/10 border border-accent-orange/25 text-accent-orange hover:bg-accent-orange/20'
              }`}
            >
              <Swords size={11} /> Ver missão
            </button>
          )}
          {hasTaskCreated && (
            <button
              onClick={() => router.push('/tasks')}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isUser
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-accent-green/10 border border-accent-green/25 text-accent-green hover:bg-accent-green/20'
              }`}
            >
              <CheckCircle2 size={11} /> Ver tarefa
            </button>
          )}
        </div>

        {/* Timestamp */}
        <p className={`mt-1 text-[10px] ${
          isUser ? 'text-white/50' : 'text-text-dim'
        }`}>
          {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

// Static waveform shape (decorative) — 20 bars with varying heights using sine
const WAVE_HEIGHTS = Array.from({ length: 20 }, (_, i) =>
  Math.round((Math.sin(i * 0.85 + 0.5) * 0.38 + 0.62) * 22)
);

function VoiceBubble({ audioUrl, duration }: { audioUrl: string; duration: number }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => { setPlaying(false); setProgress(0); };
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    return () => { audio.pause(); audioRef.current = null; };
  }, [audioUrl]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2.5 min-w-[180px] py-0.5">
      <button
        onClick={toggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
      >
        {playing ? <Pause size={13} /> : <Play size={13} />}
      </button>

      {/* Waveform bars */}
      <div className="relative flex-1 flex items-end gap-[2px] h-6 overflow-hidden">
        {WAVE_HEIGHTS.map((h, i) => {
          const pct = ((i + 1) / WAVE_HEIGHTS.length) * 100;
          const filled = pct <= progress;
          return (
            <div
              key={i}
              className={`w-[3px] rounded-full transition-colors ${filled ? 'bg-white' : 'bg-white/40'}`}
              style={{ height: `${h}px` }}
            />
          );
        })}
      </div>

      <span className="text-[11px] text-white/70 shrink-0 tabular-nums">{fmt(duration)}</span>
      <Mic size={11} className="text-white/50 shrink-0" />
    </div>
  );
}

function ActionIcon({ type }: { type: string }) {
  const cls = 'h-2.5 w-2.5';
  switch (type) {
    case 'CREATE_TASK': return <Plus className={cls} />;
    case 'COMPLETE_TASK': return <CheckCircle2 className={cls} />;
    case 'DELETE_TASK': return <Trash2 className={cls} />;
    case 'UPDATE_TASK': return <PenLine className={cls} />;
    case 'CREATE_MISSION': return <Target className={cls} />;
    case 'UPDATE_MISSION': return <RefreshCw className={cls} />;
    case 'AWARD_XP': return <Zap className={cls} />;
    case 'UPDATE_LAYOUT': return <LayoutDashboard className={cls} />;
    case 'CREATE_CHAT_CHANNEL': return <MessageSquarePlus className={cls} />;
    case 'ADD_ROUTINE_BLOCK': return <Calendar className={cls} />;
    case 'DELETE_ROUTINE_BLOCK': return <Trash2 className={cls} />;
    case 'SET_ALARM': return <Bell className={cls} />;
    case 'UPDATE_PROFILE': return <UserCog className={cls} />;
    case 'CREATE_EXERCISE_LOG': return <Dumbbell className={cls} />;
    case 'CREATE_PROJECT': return <FolderPlus className={cls} />;
    case 'UPDATE_PROJECT': return <FolderEdit className={cls} />;
    case 'DELETE_PROJECT': return <FolderX className={cls} />;
    case 'ADD_PROJECT_TASK': return <ListPlus className={cls} />;
    case 'COMPLETE_PROJECT_TASK': return <CheckSquare className={cls} />;
    default: return <Zap className={cls} />;
  }
}

function actionLabel(type: string): string {
  const labels: Record<string, string> = {
    CREATE_TASK: 'Tarefa criada',
    COMPLETE_TASK: 'Tarefa concluída',
    DELETE_TASK: 'Tarefa removida',
    UPDATE_TASK: 'Tarefa editada',
    CREATE_MISSION: 'Missão criada',
    UPDATE_MISSION: 'Missão atualizada',
    AWARD_XP: '+XP',
    UPDATE_LAYOUT: 'Dashboard',
    CREATE_CHAT_CHANNEL: 'Canal criado',
    ADD_ROUTINE_BLOCK: 'Rotina',
    DELETE_ROUTINE_BLOCK: 'Rotina removida',
    SET_ALARM: 'Alarme',
    UPDATE_PROFILE: 'Perfil',
    CREATE_EXERCISE_LOG: 'Treino registrado',
    CREATE_PROJECT: 'Projeto criado',
    UPDATE_PROJECT: 'Projeto atualizado',
    DELETE_PROJECT: 'Projeto removido',
    ADD_PROJECT_TASK: 'Tarefa no projeto',
    COMPLETE_PROJECT_TASK: 'Subtarefa concluída',
  };
  return labels[type] || type;
}
