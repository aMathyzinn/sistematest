import { v4 as uuidv4 } from 'uuid';
import { getDB } from './idb';
import type {
  Task,
  Mission,
  ChatChannel,
  ChatMessage,
  RoutineBlock,
  Alarm,
  DailyLog,
  PomodoroSession,
} from '@/lib/types';

// ============================================================
// TASKS
// ============================================================

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function getTasksByStatus(status: Task['status']): Promise<Task[]> {
  const db = await getDB();
  return db.getAllFromIndex('tasks', 'by-status', status);
}

export async function getTasksByCategory(category: Task['category']): Promise<Task[]> {
  const db = await getDB();
  return db.getAllFromIndex('tasks', 'by-category', category);
}

export async function addTask(task: Omit<Task, 'id' | 'createdAt' | 'order'>): Promise<Task> {
  const db = await getDB();
  const allTasks = await db.getAll('tasks');
  const newTask: Task = {
    ...task,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    order: allTasks.length,
  };
  await db.put('tasks', newTask);
  return newTask;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
  const db = await getDB();
  const task = await db.get('tasks', id);
  if (!task) return undefined;
  const updated = { ...task, ...updates };
  await db.put('tasks', updated);
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tasks', id);
}

// ============================================================
// MISSIONS
// ============================================================

export async function getMissionsByDate(date: string): Promise<Mission[]> {
  const db = await getDB();
  return db.getAllFromIndex('missions', 'by-date', date);
}

export async function getAllMissions(): Promise<Mission[]> {
  const db = await getDB();
  return db.getAll('missions');
}

export async function addMission(mission: Omit<Mission, 'id' | 'createdAt'>): Promise<Mission> {
  const db = await getDB();
  const newMission: Mission = {
    ...mission,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  await db.put('missions', newMission);
  return newMission;
}

export async function updateMission(id: string, updates: Partial<Mission>): Promise<Mission | undefined> {
  const db = await getDB();
  const mission = await db.get('missions', id);
  if (!mission) return undefined;
  const updated = { ...mission, ...updates };
  await db.put('missions', updated);
  return updated;
}

// ============================================================
// CHAT CHANNELS
// ============================================================

export async function getAllChannels(): Promise<ChatChannel[]> {
  const db = await getDB();
  return db.getAll('chat_channels');
}

export async function addChannel(channel: Omit<ChatChannel, 'id' | 'createdAt'>): Promise<ChatChannel> {
  const db = await getDB();
  const newChannel: ChatChannel = {
    ...channel,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  await db.put('chat_channels', newChannel);
  return newChannel;
}

export async function updateChannel(id: string, updates: Partial<ChatChannel>): Promise<void> {
  const db = await getDB();
  const channel = await db.get('chat_channels', id);
  if (!channel) return;
  await db.put('chat_channels', { ...channel, ...updates });
}

// ============================================================
// CHAT MESSAGES
// ============================================================

export async function getMessagesByChannel(channelId: string): Promise<ChatMessage[]> {
  const db = await getDB();
  return db.getAllFromIndex('chat_messages', 'by-channel', channelId);
}

export async function addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
  const db = await getDB();
  const newMessage: ChatMessage = {
    ...message,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  await db.put('chat_messages', newMessage);
  // Atualizar lastMessageAt do canal
  await updateChannel(message.channelId, { lastMessageAt: newMessage.createdAt });
  return newMessage;
}

// ============================================================
// ROUTINE BLOCKS
// ============================================================

export async function getAllRoutineBlocks(): Promise<RoutineBlock[]> {
  const db = await getDB();
  return db.getAll('routine_blocks');
}

export async function addRoutineBlock(block: Omit<RoutineBlock, 'id' | 'createdAt'>): Promise<RoutineBlock> {
  const db = await getDB();
  const newBlock: RoutineBlock = {
    ...block,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  await db.put('routine_blocks', newBlock);
  return newBlock;
}

export async function deleteRoutineBlock(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('routine_blocks', id);
}

// ============================================================
// ALARMS
// ============================================================

export async function getAllAlarms(): Promise<Alarm[]> {
  const db = await getDB();
  return db.getAll('alarms');
}

export async function addAlarm(alarm: Omit<Alarm, 'id' | 'createdAt'>): Promise<Alarm> {
  const db = await getDB();
  const newAlarm: Alarm = {
    ...alarm,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  await db.put('alarms', newAlarm);
  return newAlarm;
}

export async function updateAlarm(id: string, updates: Partial<Alarm>): Promise<void> {
  const db = await getDB();
  const alarm = await db.get('alarms', id);
  if (!alarm) return;
  await db.put('alarms', { ...alarm, ...updates });
}

export async function deleteAlarm(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('alarms', id);
}

// ============================================================
// DAILY LOGS
// ============================================================

export async function getDailyLog(date: string): Promise<DailyLog | undefined> {
  const db = await getDB();
  const logs = await db.getAllFromIndex('daily_logs', 'by-date', date);
  return logs[0];
}

export async function upsertDailyLog(date: string, updates: Partial<DailyLog>): Promise<DailyLog> {
  const db = await getDB();
  const existing = await getDailyLog(date);
  if (existing) {
    const updated = { ...existing, ...updates };
    await db.put('daily_logs', updated);
    return updated;
  }
  const newLog: DailyLog = {
    id: uuidv4(),
    date,
    tasksCompleted: 0,
    missionsCompleted: 0,
    pomodoroSessions: 0,
    xpEarned: 0,
    createdAt: new Date().toISOString(),
    ...updates,
  };
  await db.put('daily_logs', newLog);
  return newLog;
}

// ============================================================
// POMODORO SESSIONS
// ============================================================

export async function addPomodoroSession(session: Omit<PomodoroSession, 'id'>): Promise<PomodoroSession> {
  const db = await getDB();
  const newSession: PomodoroSession = {
    ...session,
    id: uuidv4(),
  };
  await db.put('pomodoro_sessions', newSession);
  return newSession;
}

export async function getTodayPomodoroSessions(): Promise<PomodoroSession[]> {
  const db = await getDB();
  const all = await db.getAll('pomodoro_sessions');
  const today = new Date().toISOString().split('T')[0];
  return all.filter(s => s.startedAt.startsWith(today));
}

// ============================================================
// SEED INICIAL
// ============================================================

export async function seedDefaultChannels(): Promise<void> {
  const db = await getDB();
  const channels = await db.getAll('chat_channels');
  if (channels.length === 0) {
    await addChannel({
      name: 'Sistema',
      icon: '🤖',
      description: 'Chat principal com o Sistema de Evolução',
      isSystem: true,
    });
  }
}
