'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/userStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { seedDefaultChannels } from '@/lib/db/queries';
import { ChevronRight, ChevronLeft, Sparkles, User, Target, AlertTriangle, Key } from 'lucide-react';

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
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);

  const { setProfile, completeOnboarding } = useUserStore();
  const { setApiKey: saveApiKey } = useSettingsStore();
  const router = useRouter();

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length > 0 && profession.trim().length > 0;
      case 1: return selectedObjectives.length > 0;
      case 2: return selectedDifficulties.length > 0;
      case 3: return true; // API key is optional
      default: return false;
    }
  };

  const handleFinish = async () => {
    const profile = {
      name: name.trim(),
      profession: profession.trim(),
      objectives: selectedObjectives,
      difficulties: selectedDifficulties,
      interests: [],
      createdAt: new Date().toISOString(),
    };

    setProfile(profile);
    if (apiKey.trim()) {
      saveApiKey(apiKey.trim());
    }
    completeOnboarding();
    await seedDefaultChannels();
    router.push('/dashboard');
  };

  const steps = [
    // Step 0: Nome e profissão
    <motion.div
      key="step-0"
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
        <p className="text-sm text-text-secondary">O Sistema precisa te conhecer para evoluir com você</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-text-secondary">
            Seu nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como quer ser chamado?"
            className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-text-primary placeholder:text-text-dim focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50 transition-colors"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-text-secondary">
            Sua profissão / ocupação
          </label>
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

    // Step 1: Objetivos
    <motion.div
      key="step-1"
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

    // Step 2: Dificuldades
    <motion.div
      key="step-2"
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

    // Step 3: API Key
    <motion.div
      key="step-3"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-green/20 border border-accent-green/30">
          <Key size={28} className="text-accent-green" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Conectar IA</h2>
        <p className="text-sm text-text-secondary">Cole sua chave do OpenRouter para ativar a IA</p>
      </div>

      <div className="space-y-3">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-..."
          className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-text-primary placeholder:text-text-dim focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green/50 transition-colors font-mono text-sm"
        />
        <p className="text-xs text-text-dim">
          Obtenha em{' '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue underline"
          >
            openrouter.ai/keys
          </a>
          . Você pode configurar depois em Configurações.
        </p>
      </div>
    </motion.div>,
  ];

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col">
      {/* Progress bar */}
      <div className="px-4 pt-6">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-accent-purple' : 'bg-bg-tertiary'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center justify-center rounded-xl border border-border bg-bg-card px-4 py-3 text-text-secondary hover:bg-bg-hover transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {step < 3 ? (
          <button
            onClick={() => canProceed() && setStep(step + 1)}
            disabled={!canProceed()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-purple py-3 font-semibold text-white transition-all hover:bg-accent-purple-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-purple py-3 font-semibold text-white transition-all hover:bg-accent-purple-dark animate-pulse-glow"
          >
            <Sparkles size={18} />
            Iniciar Sistema
          </button>
        )}
      </div>
    </div>
  );
}
