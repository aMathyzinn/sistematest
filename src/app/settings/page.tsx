'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUserStore } from '@/stores/userStore';
import AppShell from '@/components/layout/AppShell';
import { ArrowLeft, Key, Bot, Timer, Bell, Trash2, RotateCcw } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { apiKey, setApiKey, aiModel, setAiModel, pomodoro, updatePomodoro, notificationsEnabled, setNotifications } = useSettingsStore();
  const { reset: resetUser, profile } = useUserStore();

  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSaveKey = () => {
    setApiKey(keyInput.trim());
  };

  const handleReset = () => {
    if (confirm('Tem certeza? Isso apagará TODO seu progresso local.')) {
      resetUser();
      if (typeof window !== 'undefined') {
        localStorage.clear();
        indexedDB.deleteDatabase('sistema-evolucao');
        router.push('/');
        window.location.reload();
      }
    }
  };

  const requestNotifications = async () => {
    if (typeof Notification !== 'undefined') {
      const result = await Notification.requestPermission();
      setNotifications(result === 'granted');
    }
  };

  return (
    <AppShell showNav={false}>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-1.5 text-text-dim hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-text-primary">Configurações</h2>
        </div>

        {/* API Key */}
        <section className="rounded-2xl bg-bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-accent-purple-light" />
            <h3 className="text-sm font-semibold text-text-primary">Chave de API (OpenRouter)</h3>
          </div>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-or-..."
              className="flex-1 rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary font-mono placeholder:text-text-dim focus:border-accent-purple focus:outline-none"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="rounded-lg border border-border px-3 py-2 text-xs text-text-dim hover:text-text-primary"
            >
              {showKey ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <button
            onClick={handleSaveKey}
            className="w-full rounded-lg bg-accent-purple py-2 text-sm font-medium text-white"
          >
            Salvar
          </button>
        </section>

        {/* AI Model */}
        <section className="rounded-2xl bg-bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-accent-blue" />
            <h3 className="text-sm font-semibold text-text-primary">Modelo de IA</h3>
          </div>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
          >
            <option value="openai/gpt-5-mini">GPT-5 Mini (rápido, barato)</option>
            <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
            <option value="openai/gpt-4o">GPT-4o (inteligente)</option>
            <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
            <option value="anthropic/claude-3-haiku">Claude 3 Haiku (rápido)</option>
            <option value="google/gemini-pro-1.5">Gemini Pro 1.5</option>
            <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
          </select>
        </section>

        {/* Pomodoro */}
        <section className="rounded-2xl bg-bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-accent-red" />
            <h3 className="text-sm font-semibold text-text-primary">Pomodoro</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-text-dim">Foco (min)</label>
              <input
                type="number"
                value={pomodoro.focusDuration}
                onChange={(e) => updatePomodoro({ focusDuration: +e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-dim">Pausa (min)</label>
              <input
                type="number"
                value={pomodoro.breakDuration}
                onChange={(e) => updatePomodoro({ breakDuration: +e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-dim">Pausa longa (min)</label>
              <input
                type="number"
                value={pomodoro.longBreakDuration}
                onChange={(e) => updatePomodoro({ longBreakDuration: +e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-dim">Sessões p/ pausa longa</label>
              <input
                type="number"
                value={pomodoro.sessionsUntilLongBreak}
                onChange={(e) => updatePomodoro({ sessionsUntilLongBreak: +e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl bg-bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-accent-yellow" />
            <h3 className="text-sm font-semibold text-text-primary">Notificações</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {notificationsEnabled ? 'Ativadas ✅' : 'Desativadas'}
            </span>
            <button
              onClick={requestNotifications}
              className="rounded-lg bg-accent-yellow/10 px-3 py-1.5 text-xs font-medium text-accent-yellow"
            >
              {notificationsEnabled ? 'Reconfigurar' : 'Ativar'}
            </button>
          </div>
        </section>

        {/* Reset */}
        <section className="rounded-2xl bg-accent-red/5 border border-accent-red/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-accent-red" />
            <h3 className="text-sm font-semibold text-accent-red">Zona de Perigo</h3>
          </div>
          <p className="text-xs text-text-dim">
            Apagar todos os dados locais (perfil, tarefas, missões, chat, progresso).
          </p>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg bg-accent-red/10 px-4 py-2 text-sm font-medium text-accent-red hover:bg-accent-red/20 transition-colors"
          >
            <RotateCcw size={14} />
            Resetar Tudo
          </button>
        </section>
      </div>
    </AppShell>
  );
}
