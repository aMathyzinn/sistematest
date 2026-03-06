'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import ChatWindow from '@/components/chat/ChatWindow';
import type { ChatChannel } from '@/lib/types';
import * as db from '@/lib/db/queries';
import { MessageSquare, ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['💬', '🎯', '🔥', '⚡', '🧠', '🎮', '📝', '🌟', '🚀', '🎵', '🏆', '💡'];

export default function ChatPage() {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('💬');
  const [creating, setCreating] = useState(false);
  const [longPress, setLongPress] = useState<string | null>(null);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      await db.seedDefaultChannels();
      const data = await db.getAllChannels();
      const sorted = data.sort((a, b) =>
        (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt)
      );
      setChannels(sorted);
      if (!activeChannel && sorted.length > 0) {
        setActiveChannel(sorted[0]);
      }
    } catch {
      // DB não pronta
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await db.addChannel({ name: newName.trim(), icon: newIcon, description: newDesc.trim(), isSystem: false });
      setNewName('');
      setNewDesc('');
      setNewIcon('💬');
      setShowNewChat(false);
      await loadChannels();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar este chat e todas as mensagens?')) return;
    await db.deleteChannel(id);
    setLongPress(null);
    if (activeChannel?.id === id) setActiveChannel(null);
    await loadChannels();
  };

  // Chat view
  if (activeChannel) {
    return (
      <AppShell showHeader={false} showNav={false}>
        <div className="flex h-[100dvh] flex-col">
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
          <div className="flex-1 overflow-hidden">
            <ChatWindow channelId={activeChannel.id} />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Chats</h2>
          <button
            onClick={() => setShowNewChat(true)}
            className="flex items-center gap-1.5 rounded-xl bg-accent-purple/10 border border-accent-purple/30 px-3 py-1.5 text-xs font-medium text-accent-purple-light hover:bg-accent-purple/20 transition-colors"
          >
            <Plus size={14} />
            Novo Chat
          </button>
        </div>

        {/* Modal novo chat */}
        <AnimatePresence>
          {showNewChat && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl bg-bg-card border border-border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Novo Chat</p>
                <button onClick={() => setShowNewChat(false)} className="text-text-dim hover:text-text-primary">
                  <X size={16} />
                </button>
              </div>
              {/* Emoji picker */}
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewIcon(e)}
                    className={`h-8 w-8 rounded-lg text-lg transition-all ${newIcon === e ? 'bg-accent-purple/20 ring-1 ring-accent-purple' : 'bg-bg-tertiary hover:bg-bg-hover'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do chat"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none"
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none"
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="w-full rounded-lg bg-accent-purple py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {creating ? 'Criando...' : 'Criar Chat'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Channel list */}
        <div className="space-y-2">
          {channels.map((channel, i) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative"
            >
              <button
                onClick={() => {
                  if (longPress === channel.id) { setLongPress(null); return; }
                  setActiveChannel(channel);
                }}
                onContextMenu={(e) => { e.preventDefault(); setLongPress(channel.id === longPress ? null : channel.id); }}
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
              </button>
              {/* Delete button on long press / right click */}
              {longPress === channel.id && !channel.isSystem && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleDelete(channel.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-lg bg-accent-red/10 border border-accent-red/30 px-2 py-1 text-xs text-accent-red"
                >
                  <Trash2 size={12} /> Apagar
                </motion.button>
              )}
            </motion.div>
          ))}

          {channels.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple/10">
                <MessageSquare size={24} className="text-accent-purple-light" />
              </div>
              <p className="text-sm text-text-secondary">Nenhum chat ainda</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

