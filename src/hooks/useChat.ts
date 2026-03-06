'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, AIResponse } from '@/lib/types';
import { useUserStore } from '@/stores/userStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { streamChat, formatMessagesForAPI } from '@/lib/ai/openrouter';
import { parseAIResponse, executeActions } from '@/lib/ai/actionHandler';
import * as db from '@/lib/db/queries';

export function useChat(channelId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const { profile, level } = useUserStore();
  const { sections } = useUIStore();
  const { apiKey, aiModel } = useSettingsStore();

  // Carregar mensagens do canal
  const loadMessages = useCallback(async () => {
    try {
      const msgs = await db.getMessagesByChannel(channelId);
      setMessages(msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    } catch (e) {
      console.error('Erro ao carregar mensagens:', e);
    }
  }, [channelId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Enviar mensagem
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);
      setActionResults([]);

      // Salvar mensagem do usuário
      const userMessage = await db.addMessage({
        channelId,
        role: 'user',
        content: content.trim(),
      });

      setMessages((prev) => [...prev, userMessage]);

      // Preparar contexto para IA
      let pendingTasks: import('@/lib/types').Task[] = [];
      let todayMissions: import('@/lib/types').Mission[] = [];
      let recentExercises: import('@/lib/types').ExerciseLog[] = [];
      let activeProjects: import('@/lib/types').Project[] = [];
      try {
        pendingTasks = await db.getTasksByStatus('pending');
        const today = new Date().toISOString().split('T')[0];
        todayMissions = await db.getMissionsByDate(today);
        recentExercises = await db.getExerciseLogs(10);
        const allProjects = await db.getAllProjects();
        activeProjects = allProjects.filter((p) => p.status === 'active' || p.status === 'paused');
      } catch {
        // Ignorar se DB não está pronta
      }

      const systemPrompt = buildSystemPrompt({
        profile,
        level,
        pendingTasks,
        todayMissions,
        currentLayout: sections,
        recentExercises,
        activeProjects,
      });

      const allMessages = [...messages, userMessage];
      const apiMessages = formatMessagesForAPI(systemPrompt, allMessages.slice(-20));

      setIsLoading(true);
      setIsStreaming(true);
      setStreamingText('');

      const abort = new AbortController();
      abortRef.current = abort;

      await streamChat(apiMessages, {
        onChunk: (text) => {
          setStreamingText((prev) => prev + text);
          setIsLoading(false);
        },
        onDone: async (fullText) => {
          setIsStreaming(false);
          setStreamingText('');

          // Parsear resposta
          const parsed: AIResponse = parseAIResponse(fullText);

          // Salvar mensagem do assistente
          const assistantMessage = await db.addMessage({
            channelId,
            role: 'assistant',
            content: parsed.message,
            actions: parsed.actions,
          });

          setMessages((prev) => [...prev, assistantMessage]);

          // Executar actions
          if (parsed.actions && parsed.actions.length > 0) {
            const results = await executeActions(parsed.actions);
            setActionResults(results);
          }
        },
        onError: (err) => {
          setIsStreaming(false);
          setIsLoading(false);
          setStreamingText('');
          setError(err.message);
        },
      }, {
        apiKey: apiKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
        model: aiModel,
        signal: abort.signal,
      });
    },
    [channelId, messages, profile, level, sections, apiKey, aiModel, isStreaming]
  );

  // Cancelar stream
  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setIsLoading(false);
    setStreamingText('');
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    streamingText,
    error,
    actionResults,
    sendMessage,
    cancelStream,
    loadMessages,
  };
}
