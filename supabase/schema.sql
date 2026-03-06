-- ============================================================
-- SCHEMA DO SISTEMA DE EVOLUÇÃO PESSOAL
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Tasks
create table if not exists tasks (
  id text primary key,
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

-- Missions
create table if not exists missions (
  id text primary key,
  title text not null,
  description text,
  type text not null default 'daily',
  status text not null default 'active',
  date text not null,
  xp_reward integer not null default 50,
  progress integer default 0,
  target integer,
  icon text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz
);

-- Chat Channels
create table if not exists chat_channels (
  id text primary key,
  name text not null,
  icon text,
  description text,
  is_system boolean default false,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

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
  title text not null,
  start_time text not null,
  end_time text not null,
  category text not null default 'custom',
  is_recurring boolean default false,
  days integer[],
  created_at timestamptz not null default now()
);

-- Alarms
create table if not exists alarms (
  id text primary key,
  title text not null,
  time text not null,
  is_active boolean default true,
  is_recurring boolean default false,
  days integer[],
  type text not null default 'reminder',
  created_at timestamptz not null default now()
);

-- Daily Logs
create table if not exists daily_logs (
  id text primary key,
  date text not null unique,
  tasks_completed integer not null default 0,
  missions_completed integer not null default 0,
  pomodoro_sessions integer not null default 0,
  xp_earned integer not null default 0,
  notes text,
  mood integer,
  created_at timestamptz not null default now()
);

-- Pomodoro Sessions
create table if not exists pomodoro_sessions (
  id text primary key,
  type text not null default 'focus',
  duration integer not null,
  task_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists pomodoro_sessions_started_at_idx on pomodoro_sessions(started_at);
