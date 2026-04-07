'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import ChatWindow from '@/components/chat/ChatWindow';
import type { ChatChannel } from '@/lib/types';
import * as db from '@/lib/db/queries';
import { MessageSquare, ArrowLeft, Plus, Trash2, X, Bot, Brain, Target, Zap, BookOpen, Gamepad2, FileText, Star, Rocket, Music, Trophy, Lightbulb, Hash, Dumbbell, FolderKanban, TrendingUp, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['💬', '🎯', '🔥', '⚡', '🧠', '🎮', '📝', '🌟', '🚀', '🎵', '🏆', '💡'];

// Icon + color per channel icon key
const CHANNEL_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  '🤖': { icon: <Bot size={18} />,          color: 'text-accent-purple-light', bg: 'from-accent-purple/20 to-indigo-500/10',  border: 'border-accent-purple/20' },
  '💬': { icon: <MessageSquare size={18} />, color: 'text-accent-cyan',         bg: 'from-accent-cyan/20 to-blue-500/10',      border: 'border-accent-cyan/20' },
  '🧠': { icon: <Brain size={18} />,         color: 'text-accent-blue-light',   bg: 'from-accent-blue/20 to-cyan-500/10',      border: 'border-accent-blue/20' },
  '🎯': { icon: <Target size={18} />,        color: 'text-accent-red',           bg: 'from-accent-red/20 to-rose-500/10',      border: 'border-accent-red/20' },
  '⚡': { icon: <Zap size={18} />,           color: 'text-accent-yellow',        bg: 'from-accent-yellow/20 to-orange-500/10', border: 'border-accent-yellow/20' },
  '📝': { icon: <FileText size={18} />,      color: 'text-text-secondary',       bg: 'from-slate-500/20 to-slate-600/10',      border: 'border-slate-500/20' },
  '🌟': { icon: <Star size={18} />,          color: 'text-accent-yellow',        bg: 'from-accent-yellow/20 to-amber-500/10',  border: 'border-accent-yellow/20' },
  '🚀': { icon: <Rocket size={18} />,        color: 'text-accent-purple-light',  bg: 'from-accent-purple/20 to-pink-500/10',   border: 'border-accent-purple/20' },
  '🎵': { icon: <Music size={18} />,         color: 'text-accent-cyan',          bg: 'from-accent-cyan/20 to-teal-500/10',     border: 'border-accent-cyan/20' },
  '🏆': { icon: <Trophy size={18} />,        color: 'text-accent-yellow',        bg: 'from-accent-yellow/20 to-yellow-600/10', border: 'border-accent-yellow/20' },
  '💡': { icon: <Lightbulb size={18} />,     color: 'text-accent-orange',        bg: 'from-accent-orange/20 to-yellow-500/10', border: 'border-accent-orange/20' },
  '📚': { icon: <BookOpen size={18} />,      color: 'text-accent-blue-light',    bg: 'from-accent-blue/20 to-indigo-500/10',   border: 'border-accent-blue/20' },
  '🎮': { icon: <Gamepad2 size={18} />,      color: 'text-accent-green',         bg: 'from-accent-green/20 to-emerald-500/10', border: 'border-accent-green/20' },
  '💪': { icon: <Dumbbell size={18} />,      color: 'text-accent-orange',        bg: 'from-accent-orange/20 to-red-500/10',    border: 'border-accent-orange/20' },
  '🗂️': { icon: <FolderKanban size={18} />, color: 'text-accent-yellow',        bg: 'from-accent-yellow/20 to-amber-600/10',  border: 'border-accent-yellow/20' },
  '💰': { icon: <TrendingUp size={18} />,    color: 'text-accent-green',         bg: 'from-accent-green/20 to-emerald-600/10', border: 'border-accent-green/20' },
  '🔄': { icon: <Repeat size={18} />,        color: 'text-accent-cyan',          bg: 'from-accent-cyan/20 to-sky-500/10',      border: 'border-accent-cyan/20' },
};

const DEFAULT_CONFIG = { icon: null as React.ReactNode, color: 'text-text-secondary', bg: 'from-slate-600/20 to-slate-700/10', border: 'border-white/10' };

function getChannelConfig(icon: string) {
  return CHANNEL_CONFIG[icon] ?? DEFAULT_CONFIG;
}

function ChannelIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const cfg = getChannelConfig(icon);
  if (cfg.icon) return <>{cfg.icon}</>;
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

  const { setHideAppShell } = useUIStore();

  // Hide the persistent shell (header + nav) when a channel is open
  useEffect(() => {
    setHideAppShell(!!activeChannel);
    return () => setHideAppShell(false);
  }, [activeChannel, setHideAppShell]);

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
    const cfg = getChannelConfig(activeChannel.icon);
    return (
      <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-white/[0.04] bg-bg-secondary/80 backdrop-blur-xl px-4 py-2.5">
            <button
              onClick={() => setActiveChannel(null)}
              className="rounded-xl p-2 text-text-dim hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${cfg.bg} border ${cfg.border} ${cfg.color}`}>
              <ChannelIcon icon={activeChannel.icon} />
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
    );
  }

  return (
    <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary">Chats</h2>
            <p className="text-[10px] text-text-dim mt-0.5">Seus canais de conversa</p>
          </div>
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
              className="glass-card p-4 space-y-3"
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
          {channels.map((channel, i) => {
            const cfg = getChannelConfig(channel.icon);
            return (
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
                className="flex w-full items-center gap-3 rounded-2xl bg-bg-card/60 backdrop-blur-sm border border-white/[0.05] px-4 py-3.5 text-left transition-all hover:border-white/[0.10] hover:bg-bg-hover/50 active:scale-[0.98] group"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.04) inset' }}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${cfg.bg} border ${cfg.border} ${cfg.color} transition-transform group-hover:scale-105`}>
                  <ChannelIcon icon={channel.icon} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{channel.name}</p>
                  <p className="text-xs text-text-dim truncate mt-0.5">{channel.description}</p>
                </div>
                <Hash size={13} className="text-text-dim/40 shrink-0 group-hover:text-text-dim/70 transition-colors" />
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
            );
          })}

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
  );
}

