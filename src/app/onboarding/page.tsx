'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/userStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getUserByToken, createUser, seedDefaultChannels, setCurrentUserId, updateUserApiKey } from '@/lib/db/queries';
import { KeyRound, User, Target, AlertTriangle, Sparkles, LogIn, Key, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { queueOrPlayVoice, playVoiceBemVindo, playVoiceApiKey } from '@/lib/audio';
import AudioSpectrum from '@/components/ui/AudioSpectrum';

const objectives = [
  'Organizar minha rotina',
  'Aumentar produtividade',
  'Melhorar disciplina',
  'Estudar mais',
  'Exercitar regularmente',
  'Ganhar dinheiro',
  'Aprender programação',
  'Dormir melhor',
  'Reduzir procrastinação',
  'Desenvolver hábitos',
];

const difficulties = [
  'Procrastinação',
  'Falta de foco',
  'Sono irregular',
  'Falta de motivação',
  'Desorganização',
  'Ansiedade',
  'Sedentarismo',
  'Falta de consistência',
];

export default function OnboardingPage() {
  // step 0 = token login/register
  // step 1 = nome + profissão (novo usuário)
  // step 2 = objetivos (novo usuário)
  // step 3 = dificuldades (novo usuário)
  // step 4 = chave de API (novo usuário)
  const [step, setStep] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);

  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, userId } = useUserStore();
  const { setApiKey } = useSettingsStore();
  const router = useRouter();

  // Queue afternoon greeting — will fire on first button click (autoplay policy)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 18) queueOrPlayVoice('/audios/boa_tarde.mp3');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleTokenSubmit = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    try {
      const existing = await getUserByToken(token.trim());
      if (existing) {
        // Usuário encontrado — logar direto
        setCurrentUserId(existing.id);
        login(existing.id, existing.token, existing.profile, existing.levelData);
        if (existing.apiKey) setApiKey(existing.apiKey);
        router.replace('/dashboard');
      } else {
        // Token novo — criar conta
        setIsNewUser(true);
        setStep(1);
      }
    } catch {
      setError('Erro ao conectar. Verifique o Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    try {
      const account = await createUser(token, name, profession, selectedObjectives, selectedDifficulties);
      setCurrentUserId(account.id);
      login(account.id, account.token, account.profile, account.levelData);
      await seedDefaultChannels();
      // Go to API key step, then play voices in sequence
      setStep(4);
      playVoiceBemVindo().then(() => playVoiceApiKey());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('duplicate') || msg.includes('unique')) {
        setError('Este token já está em uso. Tente outro.');
        setStep(0);
        setIsNewUser(false);
      } else {
        setError(`Erro: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyFinish = (skip: boolean) => {
    if (!skip && apiKeyInput.trim()) {
      const trimmed = apiKeyInput.trim();
      setApiKey(trimmed);
      if (userId) updateUserApiKey(userId, trimmed).catch(() => {});
    }
    router.replace('/dashboard');
  };

  const canProceed = () => {
    switch (step) {
      case 0: return token.trim().length >= 3;
      case 1: return name.trim().length > 0 && profession.trim().length > 0;
      case 2: return selectedObjectives.length > 0;
      case 3: return selectedDifficulties.length > 0;
      default: return true;
    }
  };

  const steps = [
    // Step 0: Token de acesso
    <motion.div
      key="step-0"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple/20 border border-accent-purple/30">
          <KeyRound size={28} className="text-accent-purple-light" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Acesso ao Sistema</h2>
        <p className="text-sm text-text-secondary">
          Digite seu token para entrar. Se não tiver um, crie agora — qualquer palavra serve.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-secondary">Token de acesso</label>
        <input
          type="text"
          value={token}
          onChange={(e) => { setToken(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && canProceed() && !loading && handleTokenSubmit()}
          placeholder="Ex: guerreiro123, minha-jornada..."
          autoComplete="off"
          className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50 transition-colors"
        />
        <p className="text-xs text-text-dim">Mínimo 3 caracteres. Guarde bem — é sua senha.</p>
      </div>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      <button
        onClick={handleTokenSubmit}
        disabled={!canProceed() || loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-purple px-6 py-3 font-semibold text-white shadow-lg shadow-accent-purple/20 transition-all duration-200 hover:bg-accent-purple/80 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            <LogIn size={18} />
            Entrar
          </>
        )}
      </button>
    </motion.div>,

    // Step 1: Nome e profissão
    <motion.div
      key="step-1"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple/20 border border-accent-purple/30">
          <User size={28} className="text-accent-purple-light" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Quem é você?</h2>
        <p className="text-sm text-text-secondary">Conta nova detectada. Vamos criar seu perfil.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-text-secondary">Seu nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como quer ser chamado?"
            className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50 transition-colors"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-text-secondary">Profissão / ocupação</label>
          <input
            type="text"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder="Ex: Programador, Estudante, Empreendedor..."
            className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50 transition-colors"
          />
        </div>
      </div>
    </motion.div>,

    // Step 2: Objetivos
    <motion.div
      key="step-2"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-blue/20 border border-accent-blue/30">
          <Target size={28} className="text-accent-blue-light" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Seus objetivos</h2>
        <p className="text-sm text-text-secondary">Selecione o que você quer conquistar</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {objectives.map((obj) => (
          <button
            key={obj}
            onClick={() => toggleItem(selectedObjectives, obj, setSelectedObjectives)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selectedObjectives.includes(obj)
                ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20'
                : 'bg-bg-card text-text-secondary border border-border hover:border-accent-blue/50'
            }`}
          >
            {obj}
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 3: Dificuldades
    <motion.div
      key="step-3"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-orange/20 border border-accent-orange/30">
          <AlertTriangle size={28} className="text-accent-orange" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Suas dificuldades</h2>
        <p className="text-sm text-text-secondary">Onde o Sistema deve focar para te ajudar</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {difficulties.map((diff) => (
          <button
            key={diff}
            onClick={() => toggleItem(selectedDifficulties, diff, setSelectedDifficulties)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selectedDifficulties.includes(diff)
                ? 'bg-accent-orange text-white shadow-lg shadow-accent-orange/20'
                : 'bg-bg-card text-text-secondary border border-border hover:border-accent-orange/50'
            }`}
          >
            {diff}
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 4: Chave de API
    <motion.div
      key="step-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="relative space-y-6 overflow-hidden rounded-2xl"
    >
      {/* Spectrum visualiser background */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-40">
        <AudioSpectrum color="#86efac" mirror />
      </div>
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-green/20 border border-accent-green/30">
          <Key size={28} className="text-accent-green" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Chave de API</h2>
        <p className="text-sm text-text-secondary">
          Para usar a IA você precisa de uma chave do OpenRouter — é grátis para começar.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-4 space-y-2 text-xs text-text-secondary">
        <p className="font-medium text-text-primary">Como obter sua chave:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Acesse <span className="text-accent-purple-light font-mono">openrouter.ai</span></li>
          <li>Crie uma conta gratuita</li>
          <li>Vá em <span className="font-medium text-text-primary">Keys</span> e gere uma chave</li>
          <li>Cole abaixo</li>
        </ol>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-secondary">Sua chave de API</label>
        <div className="flex gap-2">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sk-or-v1-..."
            autoComplete="off"
            className="flex-1 rounded-xl border border-border bg-bg-tertiary px-4 py-3 text-sm font-mono text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50 transition-colors"
          />
          <button
            onClick={() => setShowApiKey((v) => !v)}
            className="rounded-xl border border-border px-3 text-text-dim hover:text-text-primary transition-colors"
          >
            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleApiKeyFinish(false)}
          disabled={!apiKeyInput.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-green px-6 py-3 font-semibold text-white shadow-lg shadow-accent-green/20 transition-all duration-200 hover:bg-accent-green/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ExternalLink size={16} />
          Salvar e Entrar
        </button>
        <button
          onClick={() => handleApiKeyFinish(true)}
          className="text-center text-sm text-text-dim hover:text-text-secondary transition-colors"
        >
          Pular por agora (configurar depois em Ajustes)
        </button>
      </div>
    </motion.div>,
  ];

  // step 4 is the API key step — it has its own buttons, exclude from generic nav
  const isApiKeyStep = step === 4;
  const isLastStep = step === steps.length - 2; // step 3 is the last step with generic nav
  const isTokenStep = step === 0;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-purple/20 border border-accent-purple/30">
            <Sparkles size={22} className="text-accent-purple-light" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-text-primary glow-text">SISTEMA</h1>
          {isNewUser && step > 0 && (
            <p className="mt-1 text-xs text-accent-green">✦ Criando conta — token: {token}</p>
          )}
        </div>

        {/* Progress dots (apenas para criação de conta) */}
        {isNewUser && (
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= s
                    ? s === 4 ? 'w-8 bg-accent-green' : 'w-8 bg-accent-purple'
                    : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>

        {/* Navigation (apenas nos steps de criação, exceto step 4 que tem botões próprios) */}
        {step > 0 && !isApiKeyStep && (
          <div className="flex gap-3">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={loading}
              className="flex-1 rounded-xl border border-border bg-bg-card px-6 py-3 font-medium text-text-secondary transition-colors hover:border-accent-purple/50 hover:text-text-primary disabled:opacity-40"
            >
              Voltar
            </button>

            {isLastStep ? (
              <button
                onClick={handleFinish}
                disabled={!canProceed() || loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-purple px-6 py-3 font-semibold text-white shadow-lg shadow-accent-purple/20 transition-all hover:bg-accent-purple/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Criar Conta'
                )}
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex-1 rounded-xl bg-accent-purple px-6 py-3 font-semibold text-white shadow-lg shadow-accent-purple/20 transition-all hover:bg-accent-purple/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            )}
          </div>
        )}

        {error && !isTokenStep && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
