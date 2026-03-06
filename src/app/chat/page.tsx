'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import ChatWindow from '@/components/chat/ChatWindow';
import type { ChatChannel } from '@/lib/types';
import * as db from '@/lib/db/queries';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatPage() {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      await db.seedDefaultChannels();
      const data = await db.getAllChannels();
      const sorted = data.sort((a, b) => (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt));
      setChannels(sorted);
      // Auto-select sistema channel on first load
      if (!activeChannel && sorted.length > 0) {
        setActiveChannel(sorted[0]);
      }
    } catch {
      // DB não pronta
    }
  };

  // Chat view
  if (activeChannel) {
    return (
      <AppShell showHeader={false} showNav={false}>
        <div className="flex h-[100dvh] flex-col">
          {/* Custom header */}
          <div className="flex items-center gap-3 border-b border-border bg-bg-secondary/90 backdrop-blur-lg px-4 py-3">
            <button
              onClick={() => setActiveChannel(null)}
              className="rounded-lg p-1.5 text-text-dim hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="text-lg">{activeChannel.icon}</span>
            <div>
              <p className="text-sm font-semibold text-text-primary">{activeChannel.name}</p>
              <p className="text-[10px] text-text-dim">{activeChannel.description}</p>
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow channelId={activeChannel.id} />
          </div>
        </div>
      </AppShell>
    );
  }

  // Channel list view
  return (
    <AppShell>
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Chats</h2>
        </div>

        <div className="space-y-2">
          {channels.map((channel, i) => (
            <motion.button
              key={channel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveChannel(channel)}
              className="flex w-full items-center gap-3 rounded-xl bg-bg-card border border-border px-4 py-3 text-left transition-all hover:border-accent-purple/30 hover:bg-bg-hover"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-purple/10 text-lg">
                {channel.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{channel.name}</p>
                <p className="text-xs text-text-dim truncate">{channel.description}</p>
              </div>
              <MessageSquare size={14} className="text-text-dim" />
            </motion.button>
          ))}

          {channels.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple/10">
                <MessageSquare size={24} className="text-accent-purple-light" />
              </div>
              <p className="text-sm text-text-secondary">Nenhum chat ainda</p>
              <p className="text-xs text-text-dim mt-1">Comece falando com o Sistema</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
