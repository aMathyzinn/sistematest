'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ChevronDown, Send, Square, Sparkles } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import * as db from '@/lib/db/queries';

const FAB_CHANNEL_NAME = 'Assistente Rápido';

const PAGE_HINTS: Record<string, string> = {
  '/tasks': 'Me ajude a organizar minhas tarefas',
  '/exercises': 'Me monte um treino ou registre um exercício',
  '/missions': 'Me crie uma missão para hoje',
  '/projects': 'Me ajude a planejar ou atualizar um projeto',
  '/routine': 'Monte minha rotina ideal',
  '/pomodoro': 'Me ajude a focar agora',
  '/dashboard': 'Como estou evoluindo?',
};

/**
 * Extract just the message value from partial streamed JSON.
 * Identical to the one in ChatWindow.tsx — keeps the FAB from showing
 * raw JSON like { "message": "Treino criado", "actions": [{
 */
function extractStreamingMessage(raw: string): string {
  if (!raw) return '';
  const match = raw.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (match) {
    return match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\t/g, '\t');
  }
  if (raw.trim().startsWith('{')) return '';
  return raw;
}

export default function AIAssistantFAB() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messagesByChannel,
    isLoading: globalLoading,
    isStreaming: globalStreaming,
    streamingText: globalStreamingText,
    streamingChannelId,
    actionResults,
    error,
    sendMessage,
    loadMessages,
    cancelStream,
  } = useChatStore();

  // Only show loading/streaming state when it's THIS channel being processed.
  // Without this, the FAB shows infinite dots whenever any chat channel streams.
  const isOurs = !!channelId && streamingChannelId === channelId;
  const isStreaming = isOurs && globalStreaming;
  const isLoading = isOurs && globalLoading;
  const rawStreamingText = isOurs ? globalStreamingText : '';
  const displayStreamingText = extractStreamingMessage(rawStreamingText);

  const hidden =
    !pathname ||
    pathname === '/' ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register');

  useEffect(() => {
    if (hidden) return;
    async function ensureChannel() {
      try {
        const channels = await db.getAllChannels();
        let ch = channels.find((c) => c.name === FAB_CHANNEL_NAME && c.isSystem);
        if (!ch) {
          ch = await db.addChannel({
            name: FAB_CHANNEL_NAME,
            icon: '🤖',
            description: 'Canal do assistente rápido',
            isSystem: true,
          });
        }
        setChannelId(ch.id);
        await loadMessages(ch.id);
      } catch {
        // DB not ready yet
      }
    }
    ensureChannel();
  }, [hidden, loadMessages]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, rawStreamingText, messagesByChannel]);

  if (hidden) return null;

  const messages = channelId ? (messagesByChannel[channelId] || []) : [];
  const hint = PAGE_HINTS[pathname] ?? null;

  const handleSend = () => {
    if (!input.trim() || !channelId || isStreaming) return;
    sendMessage(channelId, input.trim());
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 inset-x-0 z-50 flex flex-col rounded-t-3xl bg-bg-primary border-t border-white/[0.06] shadow-2xl"
            style={{ height: '65%' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-purple/20">
                  <Bot size={14} className="text-accent-purple-light" />
                </div>
                <span className="text-sm font-semibold text-text-primary">Assistente IA</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-text-dim hover:text-text-primary transition-colors"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-purple/20 to-indigo-500/10 border border-accent-purple/20">
                      <Bot size={28} className="text-accent-purple-light" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-purple">
                      <Sparkles size={10} className="text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary max-w-[240px] mt-1">
                    {hint ?? 'Como posso ajudar você agora?'}
                  </p>
                  {hint && (
                    <button
                      onClick={() => {
                        setInput(hint);
                        inputRef.current?.focus();
                      }}
                      className="mt-1 rounded-2xl border border-accent-purple/30 bg-accent-purple/10 px-3 py-1.5 text-xs text-accent-purple-light"
                    >
                      {hint}
                    </button>
                  )}
                </div>
              )}

              {messages.slice(-20).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent-purple/20 text-text-primary rounded-br-sm'
                        : 'bg-bg-card border border-border text-text-primary rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isStreaming && displayStreamingText && (
                <div className="flex justify-start">
                  <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-bg-card border border-border px-3 py-2 text-sm text-text-primary">
                    {displayStreamingText}
                    <span className="inline-block h-3.5 w-0.5 animate-pulse bg-accent-purple ml-0.5" />
                  </div>
                </div>
              )}

              {(isLoading || (isStreaming && !displayStreamingText)) && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-bg-card border border-border px-3 py-2">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 rounded-full bg-text-dim animate-bounce"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {actionResults.length > 0 && (
                <div className="rounded-xl bg-accent-green/5 border border-accent-green/20 p-2 space-y-0.5">
                  {actionResults.map((r, i) => (
                    <p key={i} className="text-xs text-text-secondary">
                      {r}
                    </p>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-xs text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-border bg-bg-secondary/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={hint ?? 'Pergunte ou peça algo...'}
                  disabled={isStreaming}
                  className="flex-1 rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/30 transition-colors disabled:opacity-60"
                />
                {isStreaming ? (
                  <button
                    onClick={cancelStream}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
                  >
                    <Square size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !channelId}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-purple/20 text-accent-purple-light hover:bg-accent-purple/30 transition-colors disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="absolute bottom-[72px] right-3 z-30 flex h-11 w-11 items-center justify-center rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              boxShadow: '0 4px 20px rgba(139,92,246,0.45)',
            }}
          >
            <Bot size={22} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
