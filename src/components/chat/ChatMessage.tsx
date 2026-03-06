'use client';

import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          isUser
            ? 'bg-accent-blue/20 text-accent-blue'
            : 'bg-accent-purple/20 text-accent-purple-light'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Bolha */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent-blue/20 text-text-primary rounded-tr-md'
            : 'bg-bg-card border border-border text-text-primary rounded-tl-md'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Actions badge */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.actions.map((action, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-accent-purple/10 px-2 py-0.5 text-[10px] font-medium text-accent-purple-light"
              >
                {actionIcon(action.type)} {actionLabel(action.type)}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`mt-1 text-[10px] ${isUser ? 'text-accent-blue/50' : 'text-text-dim'}`}>
          {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

function actionIcon(type: string): string {
  const icons: Record<string, string> = {
    CREATE_TASK: '✅',
    COMPLETE_TASK: '☑️',
    CREATE_MISSION: '⚔️',
    AWARD_XP: '⭐',
    UPDATE_LAYOUT: '🎨',
    CREATE_CHAT_CHANNEL: '💬',
    ADD_ROUTINE_BLOCK: '📅',
    SET_ALARM: '⏰',
    UPDATE_PROFILE: '👤',
  };
  return icons[type] || '🔧';
}

function actionLabel(type: string): string {
  const labels: Record<string, string> = {
    CREATE_TASK: 'Tarefa',
    COMPLETE_TASK: 'Concluída',
    CREATE_MISSION: 'Missão',
    AWARD_XP: 'XP',
    UPDATE_LAYOUT: 'Layout',
    CREATE_CHAT_CHANNEL: 'Canal',
    ADD_ROUTINE_BLOCK: 'Rotina',
    SET_ALARM: 'Alarme',
    UPDATE_PROFILE: 'Perfil',
  };
  return labels[type] || type;
}
