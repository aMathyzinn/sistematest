// ============================================================
// TIPOS DO SISTEMA DE EVOLUÇÃO PESSOAL
// ============================================================

// ---- Perfil do Usuário ----
export interface UserProfile {
  name: string;
  profession: string;
  objectives: string[];
  difficulties: string[];
  interests: string[];
  createdAt: string;
}

// ---- Sistema de Níveis ----
export interface UserAttributes {
  discipline: number;
  focus: number;
  consistency: number;
  strength: number;
  knowledge: number;
}

export interface UserLevel {
  level: number;
  xp: number;
  xpToNext: number;
  totalXp: number;
  attributes: UserAttributes;
}

// ---- Tarefas ----
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskCategory = 'programming' | 'study' | 'health' | 'work' | 'personal' | 'discipline' | 'custom';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  xpReward: number;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  parentId?: string; // para subtarefas
  order: number;
}

// ---- Missões ----
export type MissionType = 'physical' | 'mental' | 'productivity' | 'discipline';
export type MissionStatus = 'pending' | 'completed' | 'failed';

export interface MissionStep {
  id: string;
  title: string;      // e.g. "50 flexões declinadas"
  done: boolean;
  target?: number;    // e.g. 50
  unit?: string;      // e.g. "reps", "min", "séries"
  progress?: number;  // parcial dentro do step
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  status: MissionStatus;
  xpReward: number;
  attributeBonus: Partial<UserAttributes>;
  steps?: MissionStep[];  // exercícios/tarefas estruturados
  target?: number;        // total de steps (auto-calculado)
  progress?: number;      // steps concluídos
  date: string; // YYYY-MM-DD
  createdAt: string;
  completedAt?: string;
}

// ---- Chat ----
export interface ChatChannel {
  id: string;
  name: string;
  icon: string;
  description: string;
  createdAt: string;
  lastMessageAt?: string;
  isSystem: boolean; // canais criados automaticamente pela IA
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  channelId: string;
  role: ChatRole;
  content: string;
  actions?: AIAction[];
  createdAt: string;
}

// ---- Rotina ----
export interface RoutineBlock {
  id: string;
  title: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  category: TaskCategory;
  isRecurring: boolean;
  days?: number[]; // 0=dom, 1=seg, ..., 6=sab
  createdAt: string;
}

export interface Alarm {
  id: string;
  title: string;
  time: string; // HH:MM
  isActive: boolean;
  isRecurring: boolean;
  days?: number[];
  type: 'wake' | 'reminder' | 'break' | 'sleep';
  createdAt: string;
}

// ---- Daily Log ----
export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  mood?: number; // 1-5
  sleepHours?: number;
  tasksCompleted: number;
  missionsCompleted: number;
  pomodoroSessions: number;
  xpEarned: number;
  notes?: string;
  createdAt: string;
}

// ---- Pomodoro ----
export type PomodoroState = 'idle' | 'focus' | 'break' | 'long_break';

export interface PomodoroSession {
  id: string;
  taskId?: string;
  startedAt: string;
  completedAt?: string;
  duration: number; // minutos
  type: 'focus' | 'break' | 'long_break';
}

export interface PomodoroSettings {
  focusDuration: number;   // minutos (default: 25)
  breakDuration: number;   // minutos (default: 5)
  longBreakDuration: number; // minutos (default: 15)
  sessionsUntilLongBreak: number; // default: 4
}

// ---- Interface Dinâmica ----
export type WidgetType =
  | 'tasks_preview'
  | 'pomodoro_widget'
  | 'missions_today'
  | 'routine_today'
  | 'xp_summary'
  | 'chat_preview'
  | 'daily_stats'
  | 'custom';

export interface UISection {
  id: string;
  title: string;
  type: WidgetType;
  order: number;
  visible: boolean;
  config?: Record<string, unknown>;
}

// ---- Exercícios ----
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio' | 'full_body';

export interface ExerciseSet {
  reps: number;
  weight?: number; // kg
  duration?: number; // segundos (para exercícios de tempo)
}

export interface ExerciseLog {
  id: string;
  userId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: ExerciseSet[];
  notes?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

// ---- Projetos ----
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  deadline?: string; // ISO date
  progress: number; // 0-100
  tasks: ProjectTask[];
  createdAt: string;
  updatedAt: string;
}

// ---- Ações da IA ----
export type AIAction =
  | { type: 'CREATE_TASK'; payload: Partial<Task> & { title: string } }
  | { type: 'COMPLETE_TASK'; payload: { taskId: string } }
  | { type: 'DELETE_TASK'; payload: { taskId: string } }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; title?: string; description?: string; priority?: Task['priority']; category?: Task['category']; dueDate?: string } }
  | { type: 'CREATE_MISSION'; payload: Partial<Mission> & { title: string; type: MissionType } }
  | { type: 'UPDATE_MISSION'; payload: { missionId: string; status?: Mission['status']; progress?: number; steps?: Mission['steps'] } }
  | { type: 'AWARD_XP'; payload: { amount: number; attribute?: keyof UserAttributes } }
  | { type: 'UPDATE_LAYOUT'; payload: { sections: Partial<UISection>[] } }
  | { type: 'CREATE_CHAT_CHANNEL'; payload: { name: string; icon: string; description: string } }
  | { type: 'ADD_ROUTINE_BLOCK'; payload: Partial<RoutineBlock> & { title: string; startTime: string; endTime: string } }
  | { type: 'DELETE_ROUTINE_BLOCK'; payload: { blockId: string } }
  | { type: 'SET_ALARM'; payload: Partial<Alarm> & { title: string; time: string } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'CREATE_EXERCISE_LOG'; payload: { name: string; muscleGroup: MuscleGroup; sets: ExerciseSet[]; notes?: string; date?: string } }
  | { type: 'CREATE_PROJECT'; payload: { title: string; description?: string; deadline?: string; tasks?: string[] } }
  | { type: 'UPDATE_PROJECT'; payload: { projectId: string; status?: ProjectStatus; progress?: number; title?: string } }
  | { type: 'DELETE_PROJECT'; payload: { projectId: string } }
  | { type: 'ADD_PROJECT_TASK'; payload: { projectId: string; title: string } }
  | { type: 'COMPLETE_PROJECT_TASK'; payload: { projectId: string; taskId: string } };

// ---- Resposta da IA ----
export interface AIResponse {
  message: string;
  actions?: AIAction[];
}

// ---- Estado da App ----
export type AppView = 'onboarding' | 'dashboard' | 'chat' | 'tasks' | 'missions' | 'pomodoro' | 'routine';
