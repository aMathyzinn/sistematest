'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import ChatMessage from './ChatMessage';
import { Send, Square, Loader2, AlertCircle, CheckCircle2, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  channelId: string;
}

/**
 * Extracts just the `message` value from a partially-streamed JSON blob.
 * The AI always responds { "message": "...", "actions": [...] }.
 * During streaming the JSON arrives character-by-character — without this,
 * the user sees raw JSON like { "message": "Tarefas criadas", "actions": [{
 */
function extractStreamingMessage(raw: string): string {
  if (!raw) return '';
  // Try to pull the message value out of partial JSON
  const match = raw.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (match) {
    return match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\t/g, '\t');
  }
  // JSON started but "message" key not yet reached — stay silent
  if (raw.trim().startsWith('{')) return '';
  // Plain-text fallback (non-JSON response)
  return raw;
}

export default function ChatWindow({ channelId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    streamingText,
    error,
    actionResults,
    sendMessage,
    cancelStream,
  } = useChat(channelId);

  // Parse just the message text out of the partial JSON so we never show
  // raw JSON to the user while the AI is still streaming its response.
  const displayStreamingText = extractStreamingMessage(streamingText);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-purple/20 to-indigo-500/10 border border-accent-purple/20">
                <Bot size={36} className="text-accent-purple-light" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-purple">
                <Sparkles size={12} className="text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Sistema de Evolução</h3>
            <p className="mt-2 text-sm text-text-secondary max-w-[260px] leading-relaxed">
              Converse comigo para organizar sua vida, criar tarefas, definir metas e evoluir!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Streaming text — shows only the parsed message, not raw JSON */}
        {isStreaming && displayStreamingText && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2.5"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bg-card to-bg-tertiary border border-border text-accent-purple-light">
              <Bot size={13} />
            </div>
            <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-bg-card border border-border/60 px-4 py-2.5 text-sm text-text-primary shadow-sm">
              <p className="whitespace-pre-wrap leading-relaxed">{displayStreamingText}</p>
              <span className="inline-block h-3.5 w-0.5 animate-pulse bg-accent-purple ml-0.5 align-middle" />
            </div>
          </motion.div>
        )}

        {/* Loading dots — shown while waiting OR while JSON preamble hasn't revealed message yet */}
        {(isLoading || (isStreaming && !displayStreamingText)) && !displayStreamingText && (
          <div className="flex items-end gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bg-card to-bg-tertiary border border-border text-accent-purple-light">
              <Bot size={13} />
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-bg-card border border-border/60 px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-2 w-2 rounded-full bg-accent-purple/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-xl bg-accent-red/10 border border-accent-red/20 px-4 py-3 text-sm text-accent-red"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Results */}
        <AnimatePresence>
          {actionResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="ml-9 space-y-1 rounded-2xl bg-gradient-to-br from-accent-green/5 to-emerald-500/5 border border-accent-green/20 p-3"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-green mb-1.5">
                <CheckCircle2 size={11} />
                Ações executadas
              </div>
              {actionResults.map((result, i) => (
                <p key={i} className="text-xs text-text-secondary">{result}</p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-bg-secondary/60 backdrop-blur-sm px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-border bg-bg-card px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple/60 focus:outline-none focus:ring-2 focus:ring-accent-purple/20 transition-all max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>

          {isStreaming ? (
            <button
              onClick={cancelStream}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-red/10 border border-accent-red/30 text-accent-red transition-colors hover:bg-accent-red/20"
            >
              <Square size={15} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-purple to-indigo-500 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-accent-purple/20"
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
