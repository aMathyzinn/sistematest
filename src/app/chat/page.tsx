'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import ChatWindow from '@/components/chat/ChatWindow';
import type { ChatChannel } from '@/lib/types';
import * as db from '@/lib/db/queries';
import { MessageSquare, ArrowLeft, Plus, Trash2, X, Bot, Brain, Target, Zap, BookOpen, Gamepad2, FileText, Star, Rocket, Music, Trophy, Lightbulb, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['💬', '🎯', '🔥', '⚡', '🧠', '🎮', '📝', '🌟', '🚀', '🎵', '🏆', '💡'];

const SYSTEM_ICONS: Record<string, React.ReactNode> = {
  '🤖': <Bot size={18} />,
  '💬': <MessageSquare size={18} />,
  '🧠': <Brain size={18} />,
  '🎯': <Target size={18} />,
  '⚡': <Zap size={18} />,
  '📝': <FileText size={18} />,
  '🌟': <Star size={18} />,
  '🚀': <Rocket size={18} />,
  '🎵': <Music size={18} />,
  '🏆': <Trophy size={18} />,
  '💡': <Lightbulb size={18} />,
  '📚': <BookOpen size={18} />,
  '🎮': <Gamepad2 size={18} />,
};

function ChannelIcon({ icon, isSystem, size = 18 }: { icon: string; isSystem: boolean; size?: number }) {
  if (isSystem && SYSTEM_ICONS[icon]) {
    return <>{SYSTEM_ICONS[icon]}</>;
  }
  // User channels: render emoji in a styled span
  return <span style={{ fontSize: size - 2, lineHeight: 1 }}>{icon}</span>;
}

export default function ChatPage() {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadChannels = async (attempt = 0) => {
    try {
      await db.seedDefaultChannels();
      const data = await db.getAllChannels();
      const sorted = data.sort((a, b) =>
        (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt)
      );
      setChannels(sorted);
      setLoading(false);
      if (!activeChannel && sorted.length > 0) {
        setActiveChannel(sorted[0]);
      }
    } catch (e) {
      // Session not ready yet (SessionProvider fires after children effects).
      // Retry up to 10 times with increasing delay.
      const msg = (e as Error)?.message || '';
      if (attempt < 10) {
        setTimeout(() => loadChannels(attempt + 1), 250 * (attempt + 1));
      } else {
        setLoading(false); // give up — show real empty state
      }
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
          <div className="flex items-center gap-3 border-b border-border/60 bg-bg-secondary/95 backdrop-blur-lg px-4 py-3">
            <button
              onClick={() => setActiveChannel(null)}
              className="rounded-xl p-2 text-text-dim hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-purple/20 to-indigo-500/10 border border-accent-purple/20 text-accent-purple-light">
              <ChannelIcon icon={activeChannel.icon} isSystem={activeChannel.isSystem} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary leading-tight">{activeChannel.name}</p>
              {activeChannel.description && (
                <p className="text-[10px] text-text-dim truncate">{activeChannel.description}</p>
              )}
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
                className="flex w-full items-center gap-3 rounded-2xl bg-bg-card border border-border/50 px-4 py-3.5 text-left transition-all hover:border-accent-purple/40 hover:bg-bg-hover active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-purple/15 to-indigo-500/10 border border-accent-purple/15 text-accent-purple-light">
                  <ChannelIcon icon={channel.icon} isSystem={channel.isSystem} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{channel.name}</p>
                  <p className="text-xs text-text-dim truncate mt-0.5">{channel.description}</p>
                </div>
                <Hash size={13} className="text-text-dim/50 shrink-0" />
              </button>
              {/* Delete button on long press / right click */}
              {longPress === channel.id && !channel.isSystem && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleDelete(channel.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-xl bg-accent-red/10 border border-accent-red/30 px-2.5 py-1.5 text-xs text-accent-red font-medium"
                >
                  <Trash2 size={12} /> Apagar
                </motion.button>
              )}
            </motion.div>
          ))}

          {loading && channels.length === 0 && (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent-purple" />
              <p className="text-xs text-text-dim">Carregando chats...</p>
            </div>
          )}
          {!loading && channels.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-purple/10 border border-accent-purple/15">
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

