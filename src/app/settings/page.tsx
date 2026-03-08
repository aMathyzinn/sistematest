'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUserStore } from '@/stores/userStore';
import { updateUserApiKey, updateUserToken, getUserByToken } from '@/lib/db/queries';
import { ArrowLeft, Key, Bot, Timer, Bell, Trash2, RotateCcw, RefreshCw, Volume2, LogOut } from 'lucide-react';
import { playNotificationSound, playAlarmSound, playClick, playSuccess, playNavSwitch, playToggle, playDelete, playVoiceNotification } from '@/lib/audio';

export default function SettingsPage() {
  const router = useRouter();
  const { apiKey, setApiKey, aiModel, setAiModel, pomodoro, updatePomodoro, notificationsEnabled, setNotifications, soundEnabled, setSoundEnabled } = useSettingsStore();
  const { reset: resetUser, profile, userId, token: currentToken, login, level } = useUserStore();

  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const [newToken, setNewToken] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenMsg, setTokenMsg] = useState('');

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    setApiKey(trimmed);
    if (userId) updateUserApiKey(userId, trimmed).catch(() => {});
  };

  const handleChangeToken = async () => {
    if (!newToken.trim() || newToken.trim().length < 3 || !userId || !profile) return;
    setTokenLoading(true);
    setTokenMsg('');
    try {
      const existing = await getUserByToken(newToken.trim());
      if (existing) {
        setTokenMsg('Token já em uso. Escolha outro.');
        return;
      }
      await updateUserToken(userId, newToken.trim());
      login(userId, newToken.trim(), profile, level);
      setNewToken('');
      setTokenMsg('Token alterado com sucesso!');
    } catch {
      setTokenMsg('Erro ao alterar token. Tente novamente.');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Sair da conta? Seus dados ficam salvos no servidor.')) {
      resetUser();
      router.replace('/onboarding');
    }
  };

  const handleReset = () => {
    if (confirm('Tem certeza? Isso encerrará sua sessão e limpará os dados locais. Seus dados no servidor serão mantidos.')) {
      resetUser();
      if (typeof window !== 'undefined') {
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
      if (result === 'granted') playVoiceNotification();
    }
  };

  return (
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
                min="1"
                max="120"
                value={pomodoro.focusDuration}
                onChange={(e) => updatePomodoro({ focusDuration: Math.min(120, Math.max(1, +e.target.value)) })}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-dim">Pausa (min)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={pomodoro.breakDuration}
                onChange={(e) => updatePomodoro({ breakDuration: Math.min(60, Math.max(1, +e.target.value)) })}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-dim">Pausa longa (min)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={pomodoro.longBreakDuration}
                onChange={(e) => updatePomodoro({ longBreakDuration: Math.min(60, Math.max(1, +e.target.value)) })}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-dim">Sessões p/ pausa longa</label>
              <input
                type="number"
                min="1"
                max="10"
                value={pomodoro.sessionsUntilLongBreak}
                onChange={(e) => updatePomodoro({ sessionsUntilLongBreak: Math.min(10, Math.max(1, +e.target.value)) })}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-purple focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Sound Effects */}
        <section className="rounded-2xl bg-bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-accent-cyan" />
            <h3 className="text-sm font-semibold text-text-primary">Efeitos Sonoros</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {soundEnabled ? 'Ativados ✅' : 'Desativados'}
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              data-sound="none"
              className={`relative h-6 w-11 rounded-full transition-colors ${soundEnabled ? 'bg-accent-cyan' : 'bg-bg-tertiary border border-border'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { label: 'Click', fn: playClick },
              { label: 'Navegar', fn: playNavSwitch },
              { label: 'Toggle', fn: playToggle },
              { label: 'Sucesso', fn: playSuccess },
              { label: 'Deletar', fn: playDelete },
              { label: 'Alarme', fn: playAlarmSound },
            ] as { label: string; fn: () => void }[]).map(({ label, fn }) => (
              <button
                key={label}
                onClick={fn}
                data-sound="none"
                className="rounded-lg bg-bg-tertiary border border-border px-2 py-2 text-xs text-text-secondary hover:text-text-primary hover:border-accent-cyan/40 transition-colors"
              >
                {label}
              </button>
            ))}
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
          <div className="flex items-center gap-2 pt-1">
            <Volume2 size={14} className="text-text-dim" />
            <span className="text-xs text-text-dim flex-1">Testar sons</span>
            <button
              onClick={playNotificationSound}
              data-sound="none"
              className="rounded-lg bg-accent-blue/10 px-3 py-1.5 text-xs font-medium text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20 transition-colors"
            >
              🔔 Notificação
            </button>
            <button
              onClick={playAlarmSound}
              data-sound="none"
              className="rounded-lg bg-accent-red/10 px-3 py-1.5 text-xs font-medium text-accent-red border border-accent-red/20 hover:bg-accent-red/20 transition-colors"
            >
              ⏰ Alarme
            </button>
          </div>
        </section>

        {/* Alterar Token */}
        <section className="rounded-2xl bg-bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-accent-green" />
            <h3 className="text-sm font-semibold text-text-primary">Alterar Token</h3>
          </div>
          <p className="text-xs text-text-dim">
            Token atual: <span className="font-mono text-text-secondary">{currentToken}</span>
          </p>
          <input
            type="text"
            value={newToken}
            onChange={(e) => { setNewToken(e.target.value); setTokenMsg(''); }}
            placeholder="Novo token (mín. 3 caracteres)"
            className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-green focus:outline-none"
          />
          {tokenMsg && (
            <p className={`text-xs ${tokenMsg.includes('sucesso') ? 'text-accent-green' : 'text-accent-red'}`}>
              {tokenMsg}
            </p>
          )}
          <button
            onClick={handleChangeToken}
            disabled={newToken.trim().length < 3 || tokenLoading}
            className="w-full rounded-lg bg-accent-green/10 py-2 text-sm font-medium text-accent-green border border-accent-green/30 hover:bg-accent-green/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {tokenLoading ? 'Alterando...' : 'Confirmar Alteração'}
          </button>
        </section>

        {/* Logout */}
        <section className="rounded-2xl bg-bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <LogOut size={16} className="text-text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">Conta</h3>
          </div>
          <p className="text-xs text-text-dim">
            Sair da conta mantém todos os dados salvos. Use seu token para entrar novamente.
          </p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-tertiary py-2.5 text-sm font-medium text-text-secondary hover:border-accent-red/40 hover:text-accent-red hover:bg-accent-red/5 transition-colors"
          >
            <LogOut size={14} />
            Sair da conta
          </button>
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
  );
}
