'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import ChatMessage from './ChatMessage';
import { Send, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  channelId: string;
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
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple/10 animate-pulse-glow">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Sistema de Evolução</h3>
            <p className="mt-2 text-sm text-text-secondary max-w-[280px]">
              Converse comigo para organizar sua vida, criar tarefas, definir metas e evoluir!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Streaming text */}
        {isStreaming && streamingText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-purple/20 text-accent-purple-light">
              <Loader2 size={16} className="animate-spin" />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-bg-card border border-border px-4 py-3 text-sm text-text-primary">
              <p className="whitespace-pre-wrap">{streamingText}</p>
              <span className="inline-block h-4 w-0.5 animate-pulse bg-accent-purple ml-0.5" />
            </div>
          </motion.div>
        )}

        {/* Loading dots */}
        {isLoading && !streamingText && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-purple/20 text-accent-purple-light">
              <Loader2 size={16} className="animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-md bg-bg-card border border-border px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-text-dim animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-text-dim animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-text-dim animate-bounce" style={{ animationDelay: '300ms' }} />
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-1 rounded-xl bg-accent-green/5 border border-accent-green/20 p-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-medium text-accent-green mb-1">
                <CheckCircle2 size={12} />
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
      <div className="border-t border-border bg-bg-secondary/50 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50 transition-colors max-h-32"
            style={{ minHeight: '44px' }}
          />

          {isStreaming ? (
            <button
              onClick={cancelStream}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-red text-white transition-colors hover:bg-accent-red/80"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-purple text-white transition-all hover:bg-accent-purple-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
