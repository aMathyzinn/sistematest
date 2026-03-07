'use client';

import { useState, useEffect } from 'react';
import type { UISection, Mission, RoutineBlock as RoutineBlockType } from '@/lib/types';
import XPBar from '@/components/missions/XPBar';
import TaskList from '@/components/tasks/TaskList';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
import MissionCard from '@/components/missions/MissionCard';
import * as db from '@/lib/db/queries';
import { ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';

interface WidgetProps {
  section: UISection;
}

export default function Widget({ section }: WidgetProps) {
  switch (section.type) {
    case 'xp_summary':
      return <XPBar />;
    case 'tasks_preview':
      return (
        <WidgetWrapper title={section.title} href="/tasks">
          <TaskList limit={5} showAdd={false} showFilter={false} />
        </WidgetWrapper>
      );
    case 'pomodoro_widget':
      return (
        <WidgetWrapper title={section.title} href="/pomodoro">
          <PomodoroTimer compact />
        </WidgetWrapper>
      );
    case 'missions_today':
      return <MissionsTodayWidget title={section.title} />;
    case 'routine_today':
      return <RoutineTodayWidget title={section.title} />;
    case 'daily_stats':
      return <DailyStatsWidget title={section.title} />;
    case 'chat_preview':
      return (
        <WidgetWrapper title={section.title} href="/chat">
          <p className="text-sm text-text-secondary">Converse com o Sistema para organizar sua vida</p>
        </WidgetWrapper>
      );
    default:
      return (
        <WidgetWrapper title={section.title}>
          <p className="text-sm text-text-dim">{section.type}</p>
        </WidgetWrapper>
      );
  }
}

function WidgetWrapper({
  title,
  children,
  href,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="rounded-2xl bg-bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {href && (
          <Link href={href} className="flex items-center gap-0.5 text-xs text-accent-purple-light hover:text-accent-purple transition-colors">
            Ver tudo <ChevronRight size={12} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function MissionsTodayWidget({ title }: { title: string }) {
  const [missions, setMissions] = useState<Mission[]>([]);

  const loadMissions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await db.getMissionsByDate(today);
      setMissions(data);
    } catch {
      // DB not ready or user not authenticated yet
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  return (
    <WidgetWrapper title={title} href="/missions">
      {missions.length > 0 ? (
        <div className="space-y-2">
          {missions.slice(0, 3).map((m) => (
            <MissionCard key={m.id} mission={m} onUpdate={loadMissions} />
          ))}
          {missions.length > 3 && (
            <p className="text-xs text-text-dim text-center">+{missions.length - 3} missões</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-dim py-4 text-center">
          Converse com o Sistema para gerar missões
        </p>
      )}
    </WidgetWrapper>
  );
}

function RoutineTodayWidget({ title }: { title: string }) {
  const [blocks, setBlocks] = useState<RoutineBlockType[]>([]);

  useEffect(() => {
    db.getAllRoutineBlocks().then((data) => {
      const today = new Date().getDay();
      const filtered = data.filter(
        (b) => !b.days || b.days.length === 0 || b.days.includes(today)
      );
      setBlocks(filtered.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    }).catch(() => {});
  }, []);

  return (
    <WidgetWrapper title={title} href="/routine">
      {blocks.length > 0 ? (
        <div className="space-y-1">
          {blocks.slice(0, 5).map((block) => (
            <div key={block.id} className="flex items-center gap-3 py-1.5">
              <Clock size={12} className="text-text-dim shrink-0" />
              <span className="text-xs font-mono text-accent-blue">{block.startTime}</span>
              <span className="text-xs text-text-primary">{block.title}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-dim py-4 text-center">
          Nenhum bloco de rotina definido
        </p>
      )}
    </WidgetWrapper>
  );
}

function DailyStatsWidget({ title }: { title: string }) {
  const [stats, setStats] = useState({ tasks: 0, missions: 0, pomodoro: 0, xp: 0 });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    db.getDailyLog(today).then((log) => {
      if (log) {
        setStats({
          tasks: log.tasksCompleted,
          missions: log.missionsCompleted,
          pomodoro: log.pomodoroSessions,
          xp: log.xpEarned,
        });
      }
    }).catch(() => {});
  }, []);

  return (
    <WidgetWrapper title={title}>
      <div className="grid grid-cols-4 gap-2">
        <StatBox label="Tarefas" value={stats.tasks} color="accent-blue" />
        <StatBox label="Missões" value={stats.missions} color="accent-orange" />
        <StatBox label="Pomodoro" value={stats.pomodoro} color="accent-red" />
        <StatBox label="XP" value={stats.xp} color="accent-yellow" />
      </div>
    </WidgetWrapper>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-bg-tertiary p-2">
      <span className={`text-lg font-bold text-${color}`}>{value}</span>
      <span className="text-[10px] text-text-dim">{label}</span>
    </div>
  );
}
