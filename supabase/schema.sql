-- ============================================================
-- SCHEMA DO SISTEMA DE EVOLUÇÃO PESSOAL
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Limpar tabelas antigas (ordem importa por causa das FKs)
drop table if exists projects cascade;
drop table if exists exercise_logs cascade;
drop table if exists pomodoro_sessions cascade;
drop table if exists daily_logs cascade;
drop table if exists alarms cascade;
drop table if exists routine_blocks cascade;
drop table if exists chat_messages cascade;
drop table if exists chat_channels cascade;
drop table if exists missions cascade;
drop table if exists tasks cascade;
drop table if exists users cascade;

-- Users (login via token — sem email/senha)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  name text not null,
  profession text not null default '',
  objectives text[] not null default '{}',
  difficulties text[] not null default '{}',
  interests text[] not null default '{}',
  level_data jsonb not null default '{"level":1,"xp":0,"xpToNext":100,"totalXp":0,"attributes":{"discipline":1,"focus":1,"consistency":1,"strength":1,"knowledge":1}}',
  api_key text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table users disable row level security;

-- Tasks
create table if not exists tasks (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'custom',
  priority text not null default 'medium',
  status text not null default 'pending',
  xp_reward integer not null default 20,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  due_date timestamptz,
  parent_id text,
  "order" integer not null default 0
);
alter table tasks disable row level security;
create index if not exists tasks_user_id_idx on tasks(user_id);

-- Missions
create table if not exists missions (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'daily',
  status text not null default 'active',
  date text not null,
  xp_reward integer not null default 50,
  progress integer default 0,
  target integer,
  icon text,
  steps jsonb not null default '[]',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz
);
alter table missions disable row level security;
create index if not exists missions_user_id_idx on missions(user_id);

-- Chat Channels
create table if not exists chat_channels (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  icon text,
  description text,
  is_system boolean default false,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);
alter table chat_channels disable row level security;
create index if not exists chat_channels_user_id_idx on chat_channels(user_id);

-- Chat Messages
create table if not exists chat_messages (
  id text primary key,
  channel_id text not null references chat_channels(id) on delete cascade,
  role text not null,
  content text not null,
  actions jsonb,
  created_at timestamptz not null default now()
);
alter table chat_messages disable row level security;
create index if not exists chat_messages_channel_id_idx on chat_messages(channel_id);
create index if not exists chat_messages_created_at_idx on chat_messages(created_at);

-- Routine Blocks
create table if not exists routine_blocks (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  start_time text not null,
  end_time text not null,
  category text not null default 'custom',
  is_recurring boolean default false,
  days integer[],
  created_at timestamptz not null default now()
);
alter table routine_blocks disable row level security;
create index if not exists routine_blocks_user_id_idx on routine_blocks(user_id);

-- Alarms
create table if not exists alarms (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  time text not null,
  is_active boolean default true,
  is_recurring boolean default false,
  days integer[],
  type text not null default 'reminder',
  created_at timestamptz not null default now()
);
alter table alarms disable row level security;
create index if not exists alarms_user_id_idx on alarms(user_id);

-- Daily Logs
create table if not exists daily_logs (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  date text not null,
  tasks_completed integer not null default 0,
  missions_completed integer not null default 0,
  pomodoro_sessions integer not null default 0,
  xp_earned integer not null default 0,
  notes text,
  mood integer,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
alter table daily_logs disable row level security;
create index if not exists daily_logs_user_id_idx on daily_logs(user_id);

-- Pomodoro Sessions
create table if not exists pomodoro_sessions (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  type text not null default 'focus',
  duration integer not null,
  task_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table pomodoro_sessions disable row level security;
create index if not exists pomodoro_sessions_user_id_idx on pomodoro_sessions(user_id);
create index if not exists pomodoro_sessions_started_at_idx on pomodoro_sessions(started_at);

create table if not exists exercise_logs (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  muscle_group text not null default 'full_body',
  sets jsonb not null default '[]',
  notes text,
  date text not null,
  created_at timestamptz not null default now()
);
alter table exercise_logs disable row level security;
create index if not exists exercise_logs_user_id_idx on exercise_logs(user_id);
create index if not exists exercise_logs_date_idx on exercise_logs(date);

create table if not exists projects (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active',
  deadline text,
  progress integer not null default 0,
  tasks jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table projects disable row level security;
create index if not exists projects_user_id_idx on projects(user_id);

-- ============================================================
-- MIGRAÇÃO: colunas settings e ui_settings na tabela users
-- Execute no SQL Editor do Supabase se a tabela já existe
-- ============================================================
alter table users
  add column if not exists settings jsonb not null default '{"aiModel":"openai/gpt-4o-mini","pomodoro":{"focusDuration":25,"breakDuration":5,"longBreakDuration":15,"sessionsUntilLongBreak":4},"soundEnabled":true,"notificationsEnabled":false,"language":"pt-BR"}',
  add column if not exists ui_settings jsonb not null default '{"theme":"dark","sections":[{"id":"xp-summary","title":"Nível & XP","type":"xp_summary","order":0,"visible":true},{"id":"missions-today","title":"Missões de Hoje","type":"missions_today","order":1,"visible":true},{"id":"tasks-preview","title":"Tarefas","type":"tasks_preview","order":2,"visible":true},{"id":"pomodoro-widget","title":"Pomodoro","type":"pomodoro_widget","order":3,"visible":true},{"id":"routine-today","title":"Rotina","type":"routine_today","order":4,"visible":true}]}';

-- Tasks
create table if not exists tasks (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'custom',
  priority text not null default 'medium',
  status text not null default 'pending',
  xp_reward integer not null default 20,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  due_date timestamptz,
  parent_id text,
  "order" integer not null default 0
);
create index if not exists tasks_user_id_idx on tasks(user_id);

-- Missions
create table if not exists missions (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'daily',
  status text not null default 'active',
  date text not null,
  xp_reward integer not null default 50,
  progress integer default 0,
  target integer,
  icon text,
  steps jsonb not null default '[]',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz
);
create index if not exists missions_user_id_idx on missions(user_id);

-- Chat Channels
create table if not exists chat_channels (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  icon text,
  description text,
  is_system boolean default false,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists chat_channels_user_id_idx on chat_channels(user_id);

-- Chat Messages
create table if not exists chat_messages (
  id text primary key,
  channel_id text not null references chat_channels(id) on delete cascade,
  role text not null,
  content text not null,
  actions jsonb,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_channel_id_idx on chat_messages(channel_id);
create index if not exists chat_messages_created_at_idx on chat_messages(created_at);

-- Routine Blocks
create table if not exists routine_blocks (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  start_time text not null,
  end_time text not null,
  category text not null default 'custom',
  is_recurring boolean default false,
  days integer[],
  created_at timestamptz not null default now()
);
create index if not exists routine_blocks_user_id_idx on routine_blocks(user_id);

-- Alarms
create table if not exists alarms (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  time text not null,
  is_active boolean default true,
  is_recurring boolean default false,
  days integer[],
  type text not null default 'reminder',
  created_at timestamptz not null default now()
);
create index if not exists alarms_user_id_idx on alarms(user_id);

-- Daily Logs
create table if not exists daily_logs (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  date text not null,
  tasks_completed integer not null default 0,
  missions_completed integer not null default 0,
  pomodoro_sessions integer not null default 0,
  xp_earned integer not null default 0,
  notes text,
  mood integer,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
create index if not exists daily_logs_user_id_idx on daily_logs(user_id);

-- Pomodoro Sessions
create table if not exists pomodoro_sessions (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  type text not null default 'focus',
  duration integer not null,
  task_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists pomodoro_sessions_user_id_idx on pomodoro_sessions(user_id);
create index if not exists pomodoro_sessions_started_at_idx on pomodoro_sessions(started_at);

create table if not exists exercise_logs (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  muscle_group text not null default 'full_body',
  sets jsonb not null default '[]',
  notes text,
  date text not null,
  created_at timestamptz not null default now()
);
create index if not exists exercise_logs_user_id_idx on exercise_logs(user_id);
create index if not exists exercise_logs_date_idx on exercise_logs(date);

create table if not exists projects (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active',
  deadline text,
  progress integer not null default 0,
  tasks jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_id_idx on projects(user_id);
