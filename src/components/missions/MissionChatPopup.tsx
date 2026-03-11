'use client';

import { useState, useRef, useEffect } from 'react';
import type { Mission } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { streamChat } from '@/lib/ai/openrouter';
import { parseAIResponse, executeActions } from '@/lib/ai/actionHandler';
import { useSettingsStore } from '@/stores/settingsStore';

interface LocalMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildMissionSystemPrompt(mission: Mission): string {
  const stepsText =
    mission.steps && mission.steps.length > 0
      ? mission.steps
          .map(
            (s, i) =>
              `  ${i + 1}. [id:${s.id}] ${s.title}${
                s.target ? ` (${s.target} ${s.unit || ''})` : ''
              } — ${s.done ? '✅ concluído' : '⏳ pendente'}`
          )
          .join('\n')
      : '  (sem etapas)';

  return `Você é o SISTEMA DE EVOLUÇÃO, assistente especializado para ajudar com a missão abaixo.

MISSÃO ATUAL:
- ID: ${mission.id}
- Título: ${mission.title}
- Descrição: ${mission.description || 'Sem descrição'}
- Tipo: ${mission.type}
- XP: ${mission.xpReward}
- Status: ${mission.status}
- Progresso: ${mission.progress || 0}/${mission.target || 0}

ETAPAS:
${stepsText}

REGRAS:
- Fale em português do Brasil
- Máximo 3 frases por resposta
- Tom: sistema de jogo RPG, motivador e direto
- Para modificar a missão, use UPDATE_MISSION na lista de actions
- Para adicionar etapas: inclua TODAS as etapas (antigas + novas) no campo "steps" de UPDATE_MISSION
- NUNCA remova steps com done:true ao atualizar — mantenha-os com done:true
- Quando modificar, confirme o que foi alterado em 1 frase

FORMATO DE RESPOSTA — SEMPRE JSON VÁLIDO:
{
  "message": "sua mensagem aqui",
  "actions": []
}

ACTION DISPONÍVEL — UPDATE_MISSION:
{
  "type": "UPDATE_MISSION",
  "payload": {
    "missionId": "${mission.id}",
    "title": "string opcional",
    "description": "string opcional",
    "xpReward": 0,
    "steps": [
      { "id": "string", "title": "string", "done": false, "target": 0, "unit": "string" }
    ],
    "status": "pending|completed|failed (opcional)"
  }
}`;
}

interface MissionChatPopupProps {
  mission: Mission;
  onClose: () => void;
  onMissionUpdated: () => void;
}

export default function MissionChatPopup({
  mission,
  onClose,
  onMissionUpdated,
}: MissionChatPopupProps) {
  const { apiKey, aiModel } = useSettingsStore();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep mission ref fresh so system prompt reflects latest edits
  const latestMissionRef = useRef(mission);
  useEffect(() => {
    latestMissionRef.current = mission;
  }, [mission]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Cancel stream on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Extract readable text from partial streaming JSON
  const displayStreamingText = (() => {
    if (!streamingText) return '';
    const full = streamingText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,?\s*"actions"/);
    if (full) return full[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    const partial = streamingText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/);
    if (partial) return partial[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    if (streamingText.trim().startsWith('{')) return '';
    return streamingText;
  })();

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userContent = input.trim();
    setInput('');
    setError(null);

    const nextMessages: LocalMessage[] = [...messages, { role: 'user', content: userContent }];
    setMessages(nextMessages);

    const systemPrompt = buildMissionSystemPrompt(latestMissionRef.current);
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const abort = new AbortController();
    abortRef.current = abort;
    setIsStreaming(true);
    setStreamingText('');

    await streamChat(
      apiMessages,
      {
        onChunk: (text) => setStreamingText((s) => s + text),
        onDone: async (fullText) => {
          setIsStreaming(false);
          setStreamingText('');
          if (!fullText.trim()) return;
          const parsed = parseAIResponse(fullText);
          const content = parsed.message?.trim() || '✓';
          setMessages((prev) => [...prev, { role: 'assistant', content }]);
          if (parsed.actions && parsed.actions.length > 0) {
            try {
              await executeActions(parsed.actions);
              onMissionUpdated();
            } catch { /* silent */ }
          }
        },
        onError: (err) => {
          setIsStreaming(false);
          setStreamingText('');
          setError(err.message);
        },
      },
      { apiKey, model: aiModel, signal: abort.signal }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-bg-secondary border-t border-border"
        style={{ maxHeight: '72vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pb-3 border-b border-border/50">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-purple/15">
            <Sparkles size={14} className="text-accent-purple-light" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary">Me ajude nesta missão</p>
            <p className="text-[10px] text-text-dim truncate">{mission.title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-dim hover:text-text-secondary hover:bg-bg-hover transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.length === 0 && !isStreaming && (
            <p className="py-6 text-center text-xs text-text-dim leading-relaxed">
              Peça dicas, solicite ajustes nas etapas, mude o título ou descrição — a IA modifica a missão diretamente.
            </p>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-end gap-2'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-card border border-border text-accent-purple-light">
                  <Bot size={11} />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-accent-purple/15 text-text-primary rounded-br-sm'
                    : 'bg-bg-card border border-border/60 text-text-primary rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming bubble */}
          {isStreaming && displayStreamingText && (
            <div className="flex items-end gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-card border border-border text-accent-purple-light">
                <Bot size={11} />
              </div>
              <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-bg-card border border-border/60 px-3 py-2 text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                {displayStreamingText}
                <span className="inline-block h-3 w-0.5 animate-pulse bg-accent-purple ml-0.5 align-middle" />
              </div>
            </div>
          )}

          {/* Loading dots */}
          {isStreaming && !displayStreamingText && (
            <div className="flex items-end gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-card border border-border text-accent-purple-light">
                <Bot size={11} />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-bg-card border border-border/60 px-3 py-2.5">
                <div className="flex gap-1">
                  {[0, 120, 240].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-accent-purple/50 animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-xs text-accent-red">{error}</p>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 pt-2 pb-safe border-t border-border/40" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: adicione aquecimento, mude o título para..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none rounded-xl border border-border bg-bg-card px-3 py-2.5 text-xs text-text-primary placeholder:text-text-dim focus:border-accent-purple/60 focus:outline-none focus:ring-2 focus:ring-accent-purple/20 transition-all max-h-20 disabled:opacity-60"
              style={{ minHeight: '38px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-purple/20 text-accent-purple-light hover:bg-accent-purple/30 disabled:opacity-40 transition-colors"
            >
              {isStreaming ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
