import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import type {
  Task,
  Mission,
  ChatChannel,
  ChatMessage,
  RoutineBlock,
  Alarm,
  DailyLog,
  PomodoroSession,
  UserProfile,
  UserLevel,
  ExerciseLog,
  ExerciseSet,
  MuscleGroup,
  Project,
  ProjectTask,
  ProjectStatus,
} from '@/lib/types';

// ============================================================
// SESSÃO ATUAL — definido no login, reutilizado por todas as queries
// ============================================================

let _currentUserId: string | null = null;

export function setCurrentUserId(id: string | null) {
  _currentUserId = id;
}

function getUserId(): string {
  if (!_currentUserId) throw new Error('Usuário não autenticado');
  return _currentUserId;
}

// ============================================================
// HELPERS — mapear snake_case do Postgres → camelCase do app
// ============================================================

function toTask(r: Record<string, unknown>): Task {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string | undefined,
    category: r.category as Task['category'],
    priority: r.priority as Task['priority'],
    status: r.status as Task['status'],
    xpReward: r.xp_reward as number,
    createdAt: r.created_at as string,
    completedAt: r.completed_at as string | undefined,
    dueDate: r.due_date as string | undefined,
    parentId: r.parent_id as string | undefined,
    order: r.order as number,
  };
}

function toMission(r: Record<string, unknown>): Mission {
  return {
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) || '',
    type: r.type as Mission['type'],
    status: r.status as Mission['status'],
    date: r.date as string,
    xpReward: r.xp_reward as number,
    attributeBonus: {},
    progress: r.progress as number | undefined,
    target: r.target as number | undefined,
    createdAt: r.created_at as string,
    completedAt: r.completed_at as string | undefined,
  };
}

function toChannel(r: Record<string, unknown>): ChatChannel {
  return {
    id: r.id as string,
    name: r.name as string,
    icon: (r.icon as string) || '💬',
    description: (r.description as string) || '',
    isSystem: (r.is_system as boolean) || false,
    lastMessageAt: r.last_message_at as string | undefined,
    createdAt: r.created_at as string,
  };
}

function toMessage(r: Record<string, unknown>): ChatMessage {
  return {
    id: r.id as string,
    channelId: r.channel_id as string,
    role: r.role as ChatMessage['role'],
    content: r.content as string,
    actions: r.actions as ChatMessage['actions'],
    createdAt: r.created_at as string,
  };
}

function toRoutineBlock(r: Record<string, unknown>): RoutineBlock {
  return {
    id: r.id as string,
    title: r.title as string,
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    category: r.category as RoutineBlock['category'],
    isRecurring: (r.is_recurring as boolean) || false,
    days: r.days as number[] | undefined,
    createdAt: r.created_at as string,
  };
}

function toAlarm(r: Record<string, unknown>): Alarm {
  return {
    id: r.id as string,
    title: r.title as string,
    time: r.time as string,
    isActive: (r.is_active as boolean) ?? true,
    isRecurring: (r.is_recurring as boolean) || false,
    days: r.days as number[] | undefined,
    type: (r.type as Alarm['type']) || 'reminder',
    createdAt: r.created_at as string,
  };
}

function toDailyLog(r: Record<string, unknown>): DailyLog {
  return {
    id: r.id as string,
    date: r.date as string,
    tasksCompleted: r.tasks_completed as number,
    missionsCompleted: r.missions_completed as number,
    pomodoroSessions: r.pomodoro_sessions as number,
    xpEarned: r.xp_earned as number,
    notes: r.notes as string | undefined,
    mood: r.mood as number | undefined,
    createdAt: r.created_at as string,
  };
}

function toPomodoroSession(r: Record<string, unknown>): PomodoroSession {
  return {
    id: r.id as string,
    type: r.type as PomodoroSession['type'],
    duration: r.duration as number,
    taskId: r.task_id as string | undefined,
    startedAt: r.started_at as string,
    completedAt: r.completed_at as string | undefined,
  };
}

// ============================================================
// AUTH — login por token
// ============================================================

export interface UserAccount {
  id: string;
  token: string;
  apiKey: string;
  profile: UserProfile;
  levelData: UserLevel;
}

function toUserAccount(r: Record<string, unknown>): UserAccount {
  return {
    id: r.id as string,
    token: r.token as string,
    apiKey: (r.api_key as string) || '',
    profile: {
      name: r.name as string,
      profession: (r.profession as string) || '',
      objectives: (r.objectives as string[]) || [],
      difficulties: (r.difficulties as string[]) || [],
      interests: (r.interests as string[]) || [],
      createdAt: r.created_at as string,
    },
    levelData: r.level_data as UserLevel,
  };
}

export async function getUserByToken(token: string): Promise<UserAccount | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('token', token.trim())
    .maybeSingle();
  if (error || !data) return null;
  return toUserAccount(data as Record<string, unknown>);
}

export async function createUser(
  token: string,
  name: string,
  profession: string,
  objectives: string[],
  difficulties: string[]
): Promise<UserAccount> {
  const defaultLevel: UserLevel = {
    level: 1,
    xp: 0,
    xpToNext: 100,
    totalXp: 0,
    attributes: { discipline: 1, focus: 1, consistency: 1, strength: 1, knowledge: 1 },
  };
  const { data, error } = await supabase
    .from('users')
    .insert({
      token: token.trim(),
      name: name.trim(),
      profession: profession.trim(),
      objectives,
      difficulties,
      interests: [],
      level_data: defaultLevel,
      api_key: '',
    })
    .select()
    .single();
  if (error) throw error;
  return toUserAccount(data as Record<string, unknown>);
}

export async function updateUserLevel(userId: string, levelData: UserLevel): Promise<void> {
  await supabase
    .from('users')
    .update({ level_data: levelData, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function updateUserApiKey(userId: string, apiKey: string): Promise<void> {
  await supabase
    .from('users')
    .update({ api_key: apiKey, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function updateUserToken(userId: string, newToken: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ token: newToken.trim(), updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

// ============================================================
// TASKS
// ============================================================

export async function getAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', getUserId())
    .order('order');
  if (error) throw error;
  return (data || []).map(toTask);
}

export async function getTasksByStatus(status: Task['status']): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', getUserId())
    .eq('status', status)
    .order('order');
  if (error) throw error;
  return (data || []).map(toTask);
}

export async function getTasksByCategory(category: Task['category']): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', getUserId())
    .eq('category', category)
    .order('order');
  if (error) throw error;
  return (data || []).map(toTask);
}

export async function addTask(task: Omit<Task, 'id' | 'createdAt' | 'order'>): Promise<Task> {
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', getUserId());
  const newTask = {
    id: uuidv4(),
    user_id: getUserId(),
    title: task.title,
    description: task.description || null,
    category: task.category,
    priority: task.priority,
    status: task.status,
    xp_reward: task.xpReward,
    due_date: task.dueDate || null,
    parent_id: task.parentId || null,
    order: count || 0,
  };
  const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
  if (error) throw error;
  return toTask(data as Record<string, unknown>);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
  const patch: Record<string, unknown> = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.priority !== undefined) patch.priority = updates.priority;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.xpReward !== undefined) patch.xp_reward = updates.xpReward;
  if (updates.completedAt !== undefined) patch.completed_at = updates.completedAt;
  if (updates.dueDate !== undefined) patch.due_date = updates.dueDate;
  if (updates.order !== undefined) patch.order = updates.order;

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .eq('user_id', getUserId())
    .select()
    .single();
  if (error) throw error;
  return toTask(data as Record<string, unknown>);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', getUserId());
  if (error) throw error;
}

// ============================================================
// MISSIONS
// ============================================================

export async function getMissionsByDate(date: string): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('user_id', getUserId())
    .eq('date', date);
  if (error) throw error;
  return (data || []).map(toMission);
}

export async function getAllMissions(): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('user_id', getUserId())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toMission);
}

export async function addMission(mission: Omit<Mission, 'id' | 'createdAt'>): Promise<Mission> {
  const newMission = {
    id: uuidv4(),
    user_id: getUserId(),
    title: mission.title,
    description: mission.description || null,
    type: mission.type,
    status: mission.status,
    date: mission.date,
    xp_reward: mission.xpReward,
    progress: mission.progress || 0,
    target: mission.target || null,
  };
  const { data, error } = await supabase.from('missions').insert(newMission).select().single();
  if (error) throw error;
  return toMission(data as Record<string, unknown>);
}

export async function updateMission(id: string, updates: Partial<Mission>): Promise<Mission | undefined> {
  const patch: Record<string, unknown> = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.progress !== undefined) patch.progress = updates.progress;
  if (updates.completedAt !== undefined) patch.completed_at = updates.completedAt;

  const { data, error } = await supabase
    .from('missions')
    .update(patch)
    .eq('id', id)
    .eq('user_id', getUserId())
    .select()
    .single();
  if (error) throw error;
  return toMission(data as Record<string, unknown>);
}

// ============================================================
// CHAT CHANNELS
// ============================================================

export async function getAllChannels(): Promise<ChatChannel[]> {
  const { data, error } = await supabase
    .from('chat_channels')
    .select('*')
    .eq('user_id', getUserId())
    .order('created_at');
  if (error) throw error;
  return (data || []).map(toChannel);
}

export async function addChannel(channel: Omit<ChatChannel, 'id' | 'createdAt'>): Promise<ChatChannel> {
  const newChannel = {
    id: uuidv4(),
    user_id: getUserId(),
    name: channel.name,
    icon: channel.icon || null,
    description: channel.description || null,
    is_system: channel.isSystem || false,
    last_message_at: channel.lastMessageAt || null,
  };
  const { data, error } = await supabase.from('chat_channels').insert(newChannel).select().single();
  if (error) throw error;
  return toChannel(data as Record<string, unknown>);
}

export async function updateChannel(id: string, updates: Partial<ChatChannel>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.lastMessageAt !== undefined) patch.last_message_at = updates.lastMessageAt;
  if (updates.name !== undefined) patch.name = updates.name;
  const { error } = await supabase.from('chat_channels').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteChannel(id: string): Promise<void> {
  const { error } = await supabase
    .from('chat_channels')
    .delete()
    .eq('id', id)
    .eq('user_id', getUserId());
  if (error) throw error;
}

// ============================================================
// CHAT MESSAGES
// ============================================================

export async function getMessagesByChannel(channelId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at');
  if (error) throw error;
  return (data || []).map(toMessage);
}

export async function addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
  const newMessage = {
    id: uuidv4(),
    channel_id: message.channelId,
    role: message.role,
    content: message.content,
    actions: message.actions || null,
  };
  const { data, error } = await supabase.from('chat_messages').insert(newMessage).select().single();
  if (error) throw error;
  await updateChannel(message.channelId, { lastMessageAt: (data as Record<string, unknown>).created_at as string });
  return toMessage(data as Record<string, unknown>);
}

// ============================================================
// ROUTINE BLOCKS
// ============================================================

export async function getAllRoutineBlocks(): Promise<RoutineBlock[]> {
  const { data, error } = await supabase
    .from('routine_blocks')
    .select('*')
    .eq('user_id', getUserId())
    .order('start_time');
  if (error) throw error;
  return (data || []).map(toRoutineBlock);
}

export async function addRoutineBlock(block: Omit<RoutineBlock, 'id' | 'createdAt'>): Promise<RoutineBlock> {
  const newBlock = {
    id: uuidv4(),
    user_id: getUserId(),
    title: block.title,
    start_time: block.startTime,
    end_time: block.endTime,
    category: block.category,
    is_recurring: block.isRecurring,
    days: block.days || null,
  };
  const { data, error } = await supabase.from('routine_blocks').insert(newBlock).select().single();
  if (error) throw error;
  return toRoutineBlock(data as Record<string, unknown>);
}

export async function deleteRoutineBlock(id: string): Promise<void> {
  const { error } = await supabase
    .from('routine_blocks')
    .delete()
    .eq('id', id)
    .eq('user_id', getUserId());
  if (error) throw error;
}

// ============================================================
// ALARMS
// ============================================================

export async function getAllAlarms(): Promise<Alarm[]> {
  const { data, error } = await supabase
    .from('alarms')
    .select('*')
    .eq('user_id', getUserId())
    .order('time');
  if (error) throw error;
  return (data || []).map(toAlarm);
}

export async function addAlarm(alarm: Omit<Alarm, 'id' | 'createdAt'>): Promise<Alarm> {
  const newAlarm = {
    id: uuidv4(),
    user_id: getUserId(),
    title: alarm.title,
    time: alarm.time,
    is_active: alarm.isActive,
    is_recurring: alarm.isRecurring,
    days: alarm.days || null,
    type: alarm.type,
  };
  const { data, error } = await supabase.from('alarms').insert(newAlarm).select().single();
  if (error) throw error;
  return toAlarm(data as Record<string, unknown>);
}

export async function updateAlarm(id: string, updates: Partial<Alarm>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.isActive !== undefined) patch.is_active = updates.isActive;
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.time !== undefined) patch.time = updates.time;
  const { error } = await supabase.from('alarms').update(patch).eq('id', id).eq('user_id', getUserId());
  if (error) throw error;
}

export async function deleteAlarm(id: string): Promise<void> {
  const { error } = await supabase
    .from('alarms')
    .delete()
    .eq('id', id)
    .eq('user_id', getUserId());
  if (error) throw error;
}

// ============================================================
// DAILY LOGS
// ============================================================

export async function getDailyLog(date: string): Promise<DailyLog | undefined> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', getUserId())
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data ? toDailyLog(data as Record<string, unknown>) : undefined;
}

export async function upsertDailyLog(date: string, updates: Partial<DailyLog>): Promise<DailyLog> {
  const existing = await getDailyLog(date);
  if (existing) {
    const patch: Record<string, unknown> = {};
    if (updates.tasksCompleted !== undefined) patch.tasks_completed = updates.tasksCompleted;
    if (updates.missionsCompleted !== undefined) patch.missions_completed = updates.missionsCompleted;
    if (updates.pomodoroSessions !== undefined) patch.pomodoro_sessions = updates.pomodoroSessions;
    if (updates.xpEarned !== undefined) patch.xp_earned = updates.xpEarned;
    if (updates.notes !== undefined) patch.notes = updates.notes;
    if (updates.mood !== undefined) patch.mood = updates.mood;
    const { data, error } = await supabase
      .from('daily_logs')
      .update(patch)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return toDailyLog(data as Record<string, unknown>);
  }
  const newLog = {
    id: uuidv4(),
    user_id: getUserId(),
    date,
    tasks_completed: updates.tasksCompleted || 0,
    missions_completed: updates.missionsCompleted || 0,
    pomodoro_sessions: updates.pomodoroSessions || 0,
    xp_earned: updates.xpEarned || 0,
    notes: updates.notes || null,
    mood: updates.mood || null,
  };
  const { data, error } = await supabase.from('daily_logs').insert(newLog).select().single();
  if (error) throw error;
  return toDailyLog(data as Record<string, unknown>);
}

// ============================================================
// POMODORO SESSIONS
// ============================================================

export async function addPomodoroSession(session: Omit<PomodoroSession, 'id'>): Promise<PomodoroSession> {
  const newSession = {
    id: uuidv4(),
    user_id: getUserId(),
    type: session.type,
    duration: session.duration,
    task_id: session.taskId || null,
    started_at: session.startedAt,
    completed_at: session.completedAt || null,
  };
  const { data, error } = await supabase.from('pomodoro_sessions').insert(newSession).select().single();
  if (error) throw error;
  return toPomodoroSession(data as Record<string, unknown>);
}

export async function getTodayPomodoroSessions(): Promise<PomodoroSession[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', getUserId())
    .gte('started_at', `${today}T00:00:00.000Z`)
    .lt('started_at', `${today}T23:59:59.999Z`);
  if (error) throw error;
  return (data || []).map(toPomodoroSession);
}

// ============================================================
// SEED INICIAL
// ============================================================

export async function seedDefaultChannels(): Promise<void> {
  const { count } = await supabase
    .from('chat_channels')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', getUserId());

  if ((count || 0) === 0) {
    const defaults = [
      { name: 'Sistema', icon: '🤖', description: 'Chat principal com o Sistema de Evolução', isSystem: true },
      { name: 'Geral', icon: '💬', description: 'Conversas gerais e dia a dia', isSystem: true },
      { name: 'Exercícios', icon: '💪', description: 'Treinos, físico e saúde', isSystem: true },
      { name: 'Projetos', icon: '🗂️', description: 'Gestão de projetos e trabalhos', isSystem: true },
      { name: 'Finanças', icon: '💰', description: 'Vendas, finanças e metas financeiras', isSystem: true },
      { name: 'Estudos', icon: '📚', description: 'Aprendizado, cursos e conhecimento', isSystem: true },
    ];
    for (const ch of defaults) {
      await addChannel(ch);
    }
  }
}

// ============================================================
// EXERCISE LOGS
// ============================================================

function toExerciseLog(row: Record<string, unknown>): ExerciseLog {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    muscleGroup: (row.muscle_group as MuscleGroup) || 'full_body',
    sets: (row.sets as ExerciseSet[]) || [],
    notes: row.notes as string | undefined,
    date: row.date as string,
    createdAt: row.created_at as string,
  };
}

export async function getExerciseLogs(limit = 50): Promise<ExerciseLog[]> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('user_id', getUserId())
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(toExerciseLog);
}

export async function getExerciseLogsByDate(date: string): Promise<ExerciseLog[]> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('user_id', getUserId())
    .eq('date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(toExerciseLog);
}

export async function addExerciseLog(log: Omit<ExerciseLog, 'id' | 'userId' | 'createdAt'>): Promise<ExerciseLog> {
  const uid = getUserId();
  const record = {
    id: uuidv4(),
    user_id: uid,
    name: log.name,
    muscle_group: log.muscleGroup,
    sets: log.sets,
    notes: log.notes || null,
    date: log.date,
  };
  const { data, error } = await supabase.from('exercise_logs').insert(record).select().single();
  if (error) throw error;
  return toExerciseLog(data);
}

export async function deleteExerciseLog(id: string): Promise<void> {
  const { error } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', getUserId());
  if (error) throw error;
}

// ============================================================
// PROJECTS
// ============================================================

function toProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    status: (row.status as ProjectStatus) || 'active',
    deadline: row.deadline as string | undefined,
    progress: (row.progress as number) || 0,
    tasks: (row.tasks as ProjectTask[]) || [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', getUserId())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toProject);
}

export async function addProject(project: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const uid = getUserId();
  const now = new Date().toISOString();
  const record = {
    id: uuidv4(),
    user_id: uid,
    title: project.title,
    description: project.description || null,
    status: project.status,
    deadline: project.deadline || null,
    progress: project.progress,
    tasks: project.tasks,
    created_at: now,
    updated_at: now,
  };
  const { data, error } = await supabase.from('projects').insert(record).select().single();
  if (error) throw error;
  return toProject(data);
}

export async function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>): Promise<Project> {
  const record: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) record.title = updates.title;
  if (updates.description !== undefined) record.description = updates.description;
  if (updates.status !== undefined) record.status = updates.status;
  if (updates.deadline !== undefined) record.deadline = updates.deadline;
  if (updates.progress !== undefined) record.progress = updates.progress;
  if (updates.tasks !== undefined) record.tasks = updates.tasks;
  const { data, error } = await supabase
    .from('projects')
    .update(record)
    .eq('id', id)
    .eq('user_id', getUserId())
    .select()
    .single();
  if (error) throw error;
  return toProject(data);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', getUserId());
  if (error) throw error;
}
