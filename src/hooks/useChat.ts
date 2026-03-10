'use client';

import { useEffect, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';

/**
 * Thin wrapper over the global chat store.
 * Stream state lives in the store so it survives navigation.
 */
export function useChat(channelId: string) {
  const store = useChatStore();

  // Load (or reload) messages when channelId changes
  useEffect(() => {
    store.loadMessages(channelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const messages = store.messagesByChannel[channelId] ?? [];

  // Only expose stream state that belongs to this channel
  const isThisChannelStreaming = store.streamingChannelId === channelId;
  const isLoading = isThisChannelStreaming ? store.isLoading : false;
  const isStreaming = isThisChannelStreaming ? store.isStreaming : false;
  const streamingText = isThisChannelStreaming ? store.streamingText : '';
  const actionResults = isThisChannelStreaming || store.streamingChannelId === null ? store.actionResults : [];

  const sendMessage = useCallback(
    (content: string, voiceData?: { audioUrl: string; duration: number }) =>
      store.sendMessage(channelId, content, voiceData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId]
  );

  const cancelStream = useCallback(
    () => store.cancelStream(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const loadMessages = useCallback(
    () => store.loadMessages(channelId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId]
  );

  return {
    messages,
    isLoading,
    isStreaming,
    streamingText,
    error: store.error,
    actionResults,
    sendMessage,
    cancelStream,
    loadMessages,
  };
}
