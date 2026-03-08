/**
 * Global chat stream store.
 * Lives outside React component lifecycle so streams survive navigation.
 */
import { create } from 'zustand';
import type { ChatMessage, AIResponse } from '@/lib/types';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { streamChat, formatMessagesForAPI } from '@/lib/ai/openrouter';
import { parseAIResponse, executeActions } from '@/lib/ai/actionHandler';
import * as db from '@/lib/db/queries';
import { useUserStore } from '@/stores/userStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface ChatStreamState {
  // Per-channel message cache
  messagesByChannel: Record<string, ChatMessage[]>;

  // Active stream state (only one stream at a time)
  streamingChannelId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  error: string | null;
  actionResults: string[];

  // Internal abort ref (not serializable — kept as plain object)
  _abort: AbortController | null;
  // Tracks channels currently being loaded to prevent concurrent fetches
  _loadingChannels: Set<string>;

  // Actions
  loadMessages: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, content: string) => Promise<void>;
  cancelStream: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatStreamState>()((set, get) => ({
  messagesByChannel: {},
  streamingChannelId: null,
  isLoading: false,
  isStreaming: false,
  streamingText: '',
  error: null,
  actionResults: [],
  _abort: null,
  _loadingChannels: new Set<string>(),

  loadMessages: async (channelId) => {
    const state = get();
    // Prevent concurrent fetches for the same channel
    if (state._loadingChannels.has(channelId)) return;
    state._loadingChannels.add(channelId);
    try {
      const msgs = await db.getMessagesByChannel(channelId);
      const sorted = msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      set((s) => {
        // Merge: DB is authoritative for persisted messages, but keep any
        // locally-appended optimistic messages that haven't been saved yet.
        const existing = s.messagesByChannel[channelId] || [];
        const dbIds = new Set(sorted.map((m) => m.id));
        const optimistic = existing.filter((m) => !dbIds.has(m.id));
        const merged = [...sorted, ...optimistic].sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt)
        );
        return {
          messagesByChannel: { ...s.messagesByChannel, [channelId]: merged },
        };
      });
    } catch (e) {
      console.error('Erro ao carregar mensagens:', e);
    } finally {
      get()._loadingChannels.delete(channelId);
    }
  },

  sendMessage: async (channelId, content) => {
    const state = get();
    if (!content.trim() || state.isStreaming) return;

    set({ error: null, actionResults: [] });

    // Save user message
    const userMessage = await db.addMessage({ channelId, role: 'user', content: content.trim() });
    set((s) => ({
      messagesByChannel: {
        ...s.messagesByChannel,
        [channelId]: [...(s.messagesByChannel[channelId] || []), userMessage],
      },
    }));

    // Build context
    const { profile, level } = useUserStore.getState();
    const { sections } = useUIStore.getState();
    const { apiKey, aiModel } = useSettingsStore.getState();

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
    } catch { /* ignore */ }

    const systemPrompt = buildSystemPrompt({ profile, level, pendingTasks, todayMissions, currentLayout: sections, recentExercises, activeProjects });
    const currentMessages = get().messagesByChannel[channelId] || [];
    const apiMessages = formatMessagesForAPI(systemPrompt, currentMessages.slice(-8));

    const abort = new AbortController();
    set({ isLoading: true, isStreaming: true, streamingText: '', streamingChannelId: channelId, _abort: abort });

    await streamChat(
      apiMessages,
      {
        onChunk: (text) => {
          set((s) => ({ streamingText: s.streamingText + text, isLoading: false }));
        },
        onDone: async (fullText) => {
          set({ isStreaming: false, streamingText: '', streamingChannelId: null, _abort: null });

          if (!fullText.trim()) {
            set({ error: 'A IA não retornou resposta. Verifique sua chave de API e tente novamente.' });
            return;
          }

          const parsed: AIResponse = parseAIResponse(fullText);
          // Ensure message is never empty so the bubble is always visible
          const messageContent = parsed.message?.trim() || '✓';

          // Try to persist the assistant message. If it fails (e.g. session expired),
          // fall back to a local-only message so the user still sees the response.
          let assistantMessage: ChatMessage;
          try {
            assistantMessage = await db.addMessage({
              channelId,
              role: 'assistant',
              content: messageContent,
              actions: parsed.actions,
            });
          } catch (e) {
            console.error('[chat] Falha ao salvar mensagem da IA no DB:', e);
            assistantMessage = {
              id: `local-${Date.now()}`,
              channelId,
              role: 'assistant',
              content: messageContent,
              actions: parsed.actions,
              createdAt: new Date().toISOString(),
            };
          }

          set((s) => ({
            messagesByChannel: {
              ...s.messagesByChannel,
              [channelId]: [...(s.messagesByChannel[channelId] || []), assistantMessage],
            },
          }));

          if (parsed.actions && parsed.actions.length > 0) {
            try {
              const results = await executeActions(parsed.actions);
              set({ actionResults: results });
            } catch (e) {
              console.error('[chat] Falha ao executar actions:', e);
            }
          }
        },
        onError: (err) => {
          set({ isStreaming: false, isLoading: false, streamingText: '', streamingChannelId: null, _abort: null, error: err.message });
        },
      },
      {
        apiKey,
        model: aiModel,
        signal: abort.signal,
      }
    );
  },

  cancelStream: () => {
    get()._abort?.abort();
    set({ isStreaming: false, isLoading: false, streamingText: '', streamingChannelId: null, _abort: null });
  },

  clearError: () => set({ error: null }),
}));
