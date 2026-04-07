'use client';

import { useUserStore } from '@/stores/userStore';
import { Zap, Shield, Eye, Repeat, Dumbbell, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const attributeConfig = {
  discipline:  { label: 'Disciplina',    icon: Shield,   color: 'text-accent-red',          bar: 'bg-accent-red' },
  focus:       { label: 'Foco',          icon: Eye,      color: 'text-accent-blue',          bar: 'bg-accent-blue' },
  consistency: { label: 'Consistência',  icon: Repeat,   color: 'text-accent-green',         bar: 'bg-accent-green' },
  strength:    { label: 'Força',         icon: Dumbbell, color: 'text-accent-orange',        bar: 'bg-accent-orange' },
  knowledge:   { label: 'Conhecimento',  icon: BookOpen, color: 'text-accent-cyan',          bar: 'bg-accent-cyan' },
};

export default function XPBar() {
  const { level } = useUserStore();
  const xpPercent = Math.min((level.xp / level.xpToNext) * 100, 100);

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Level + XP Bar */}
      <div className="flex items-center gap-4">
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-purple/25 to-accent-blue/15 border border-accent-purple/20"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-center">
            <span className="text-lg font-bold text-accent-purple-light glow-text">
              {level.level}
            </span>
          </div>
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-text-secondary">Level {level.level}</span>
            <span className="text-[11px] text-text-dim flex items-center gap-1">
              <Zap size={9} className="text-accent-yellow" />
              {level.xp}/{level.xpToNext}
            </span>
          </div>
          <div className="xp-bar h-2 w-full">
            <motion.div
              className="xp-bar-fill h-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-1 text-[9px] text-text-dim">
            Total: {level.totalXp} XP
          </p>
        </div>
      </div>

      {/* Atributos */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.entries(attributeConfig) as [keyof typeof attributeConfig, typeof attributeConfig[keyof typeof attributeConfig]][]).map(
          ([key, config]) => {
            const value = level.attributes[key];
            const pct = Math.min((value / 100) * 100, 100);
            return (
              <div key={key} className="flex flex-col items-center gap-1.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-bg-tertiary border border-white/[0.06]`}>
                  <config.icon size={13} className={config.color} />
                </div>
                <div className="w-full h-1 rounded-full bg-bg-tertiary overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${config.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                </div>
                <span className="text-[9px] font-bold text-text-secondary">{value}</span>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
