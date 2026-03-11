import { v4 as uuidv4 } from 'uuid';
import type { AIAction, AIResponse, UserAttributes } from '@/lib/types';
import { useUserStore } from '@/stores/userStore';
import { useUIStore } from '@/stores/uiStore';
import * as db from '@/lib/db/queries';
import { playVoiceMissionCreated } from '@/lib/audio';

// ============================================================
// PARSER DE RESPOSTA DA IA
// ============================================================

export function parseAIResponse(rawText: string): AIResponse {
  // Strip markdown code fences that some models add around JSON
  const stripped = rawText
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  // Helper: try JSON.parse on a string, return null on failure
  const tryParse = (s: string): { message?: string; actions?: unknown[] } | null => {
    try { return JSON.parse(s); } catch { return null; }
  };

  // 1) Try to find a complete {...} block in the stripped text
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = tryParse(jsonMatch[0]);
    if (parsed) {
      const message = (typeof parsed.message === 'string' && parsed.message.trim())
        ? parsed.message
        : stripped.replace(/\{[\s\S]*\}/, '').trim() || '✓';
      return {
        message,
        actions: Array.isArray(parsed.actions) ? parsed.actions as AIAction[] : [],
      };
    }

    // 2) JSON is truncated — extract message and best-effort extract started actions
    const msgMatch = jsonMatch[0].match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/)
    const message = msgMatch
      ? msgMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim()
      : stripped.replace(/\{[\s\S]*\}/, '').trim() || '✓';

    // Try to salvage any complete action objects from the partial actions array
    const actions: AIAction[] = [];
    const actionRegex = /\{\s*"type"\s*:\s*"([A-Z_]+)"\s*,\s*"payload"\s*:\s*(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g;
    let m: RegExpExecArray | null;
    while ((m = actionRegex.exec(jsonMatch[0])) !== null) {
      const payloadParsed = tryParse(m[2]);
      if (payloadParsed) {
        actions.push({ type: m[1] as AIAction['type'], payload: payloadParsed } as AIAction);
      }
    }
    return { message, actions };
  }

  // 3) No JSON at all — return the raw text as message (no actions possible)
  const msgMatch2 = stripped.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/); 
  if (msgMatch2) {
    return { message: msgMatch2[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim(), actions: [] };
  }
  return { message: stripped || rawText, actions: [] };
}

// ============================================================
// EXECUTOR DE ACTIONS
// ============================================================

export async function executeActions(actions: AIAction[]): Promise<string[]> {
  const results: string[] = [];

  for (const action of actions) {
    try {
      const result = await executeAction(action);
      results.push(result);
    } catch (error) {
      console.error(`Erro ao executar action ${action.type}:`, error);
      results.push(`❌ Erro: ${action.type}`);
    }
  }

  return results;
}

async function executeAction(action: AIAction): Promise<string> {
  // Ensure the DB session is active before any DB write.
  // If _currentUserId was null (e.g. race on mobile), pull the userId from the
  // Zustand store (which is hydrated from localStorage cache at startup) and
  // re-set the session so getUserId() works for this action.
  const { userId, token } = useUserStore.getState();
  if (userId && token) {
    db.setSession(userId, token);
  }

  switch (action.type) {
    case 'CREATE_TASK': {
      const task = await db.addTask({
        title: action.payload.title,
        description: action.payload.description || '',
        category: action.payload.category || 'custom',
        priority: action.payload.priority || 'medium',
        status: 'pending',
        xpReward: Math.min(Math.max(1, action.payload.xpReward ?? 20), 200),
        dueDate: action.payload.dueDate,
      });
      return `✅ Tarefa criada: ${task.title}`;
    }

    case 'COMPLETE_TASK': {
      const task = await db.updateTask(action.payload.taskId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      if (task) {
        useUserStore.getState().addXP(task.xpReward, 'focus');
        const today = new Date().toISOString().split('T')[0];
        const log = await db.getDailyLog(today);
        await db.upsertDailyLog(today, {
          tasksCompleted: (log?.tasksCompleted || 0) + 1,
          xpEarned: (log?.xpEarned || 0) + task.xpReward,
        });
        return `✅ Tarefa concluída: ${task.title} (+${task.xpReward} XP)`;
      }
      return `⚠️ Tarefa não encontrada`;
    }

    case 'CREATE_MISSION': {
      const today = new Date().toISOString().split('T')[0];
      const rawSteps = (action.payload as Record<string, unknown>).steps as import('@/lib/types').MissionStep[] | undefined;
      const steps = (rawSteps || []).map((s, i) => ({ ...s, id: s.id || String(i + 1), done: false }));
      const mission = await db.addMission({
        title: action.payload.title,
        description: action.payload.description || '',
        type: action.payload.type,
        status: 'pending',
        xpReward: Math.min(Math.max(1, action.payload.xpReward ?? 30), 500),
        attributeBonus: action.payload.attributeBonus || {},
        steps,
        target: steps.length || action.payload.target,
        progress: 0,
        date: today,
      });
      playVoiceMissionCreated();
      return `⚔️ Missão criada: ${mission.title} (${steps.length} etapas)`;
    }

    case 'AWARD_XP': {
      const attr = action.payload.attribute as keyof UserAttributes | undefined;
      const cappedXP = Math.min(Math.max(1, action.payload.amount), 500);
      useUserStore.getState().addXP(cappedXP, attr);
      const today = new Date().toISOString().split('T')[0];
      const log = await db.getDailyLog(today);
      await db.upsertDailyLog(today, {
        xpEarned: (log?.xpEarned || 0) + cappedXP,
      });
      return `⭐ +${cappedXP} XP${attr ? ` (${attr})` : ''}`;
    }

    case 'UPDATE_LAYOUT': {
      const { sections } = action.payload;
      const store = useUIStore.getState();
      const currentSections = [...store.sections];

      for (const newSection of sections) {
        const existing = currentSections.find(s => s.id === newSection.id);
        if (existing) {
          Object.assign(existing, newSection);
        } else if (newSection.title && newSection.type) {
          currentSections.push({
            id: newSection.id || uuidv4(),
            title: newSection.title,
            type: newSection.type,
            order: newSection.order ?? currentSections.length,
            visible: newSection.visible ?? true,
            config: newSection.config,
          } as import('@/lib/types').UISection);
        }
      }

      store.setSections(currentSections.sort((a, b) => a.order - b.order));
      return `🎨 Dashboard atualizado`;
    }

    case 'CREATE_CHAT_CHANNEL': {
      const channel = await db.addChannel({
        name: action.payload.name,
        icon: action.payload.icon,
        description: action.payload.description,
        isSystem: true,
      });
      return `💬 Canal criado: ${channel.name}`;
    }

    case 'ADD_ROUTINE_BLOCK': {
      const block = await db.addRoutineBlock({
        title: action.payload.title,
        startTime: action.payload.startTime,
        endTime: action.payload.endTime,
        category: (action.payload.category as import('@/lib/types').TaskCategory) || 'custom',
        isRecurring: action.payload.isRecurring ?? true,
        days: action.payload.days,
      });
      return `📅 Rotina adicionada: ${block.title} (${block.startTime}-${block.endTime})`;
    }

    case 'SET_ALARM': {
      const alarm = await db.addAlarm({
        title: action.payload.title,
        time: action.payload.time,
        type: action.payload.type || 'reminder',
        isActive: true,
        isRecurring: action.payload.isRecurring ?? false,
        days: action.payload.days,
      });
      return `⏰ Alarme configurado: ${alarm.title} às ${alarm.time}`;
    }

    case 'UPDATE_PROFILE': {
      useUserStore.getState().updateProfile(action.payload);
      return `👤 Perfil atualizado`;
    }

    case 'CREATE_EXERCISE_LOG': {
      const today = new Date().toISOString().split('T')[0];
      const log = await db.addExerciseLog({
        name: action.payload.name,
        muscleGroup: action.payload.muscleGroup || 'full_body',
        sets: action.payload.sets || [{ reps: 10 }],
        notes: action.payload.notes,
        date: action.payload.date || today,
      });
      useUserStore.getState().addXP(15, 'strength');
      return `💪 Exercício registrado: ${log.name} (${log.sets.length} séries)`;
    }

    case 'CREATE_PROJECT': {
      const project = await db.addProject({
        title: action.payload.title,
        description: action.payload.description,
        status: 'active',
        deadline: action.payload.deadline,
        progress: 0,
        tasks: (action.payload.tasks || []).map((t: string) => ({ id: uuidv4(), title: t, done: false })),
      });
      return `🗂️ Projeto criado: ${project.title}`;
    }

    case 'UPDATE_PROJECT': {
      const p = await db.updateProject(action.payload.projectId, {
        status: action.payload.status,
        progress: action.payload.progress,
        title: action.payload.title,
      });
      return `🗂️ Projeto atualizado: ${p.title} (${p.status})`;
    }

    case 'ADD_PROJECT_TASK': {
      const projects = await db.getAllProjects();
      const target = projects.find((p) => p.id === action.payload.projectId);
      if (!target) return `⚠️ Projeto não encontrado`;
      const newTask = { id: uuidv4(), title: action.payload.title, done: false };
      const updatedTasks = [...target.tasks, newTask];
      const progress = Math.round((updatedTasks.filter((t) => t.done).length / updatedTasks.length) * 100);
      await db.updateProject(target.id, { tasks: updatedTasks, progress });
      return `✅ Tarefa adicionada ao projeto: ${action.payload.title}`;
    }

    case 'DELETE_TASK': {
      await db.deleteTask(action.payload.taskId);
      return `🗑️ Tarefa removida`;
    }

    case 'UPDATE_TASK': {
      const updates: Record<string, unknown> = {};
      if (action.payload.title) updates.title = action.payload.title;
      if (action.payload.description !== undefined) updates.description = action.payload.description;
      if (action.payload.priority) updates.priority = action.payload.priority;
      if (action.payload.category) updates.category = action.payload.category;
      if (action.payload.dueDate !== undefined) updates.dueDate = action.payload.dueDate;
      const updated = await db.updateTask(action.payload.taskId, updates as Partial<import('@/lib/types').Task>);
      return `✏️ Tarefa atualizada: ${updated?.title || action.payload.taskId}`;
    }

    case 'UPDATE_MISSION': {
      const missionUpdates: Record<string, unknown> = {};
      if (action.payload.status) missionUpdates.status = action.payload.status;
      if (action.payload.progress !== undefined) missionUpdates.progress = action.payload.progress;
      if (action.payload.steps) {
        const rawSteps = action.payload.steps as import('@/lib/types').MissionStep[];
        missionUpdates.steps = rawSteps.map((s, i) => ({ ...s, id: s.id || String(i + 1) }));
        missionUpdates.target = rawSteps.length;
      }
      if (action.payload.title) missionUpdates.title = action.payload.title;
      if (action.payload.description !== undefined) missionUpdates.description = action.payload.description;
      if (action.payload.xpReward) missionUpdates.xpReward = Math.min(Math.max(1, action.payload.xpReward), 500);
      const mission = await db.updateMission(action.payload.missionId, missionUpdates as Partial<import('@/lib/types').Mission>);
      if (mission?.status === 'completed') {
        useUserStore.getState().addXP(mission.xpReward, 'consistency');
      }
      return `⚔️ Missão atualizada: ${mission?.title}`;
    }

    case 'DELETE_PROJECT': {
      await db.deleteProject(action.payload.projectId);
      return `🗑️ Projeto removido`;
    }

    case 'COMPLETE_PROJECT_TASK': {
      const allProjects = await db.getAllProjects();
      const proj = allProjects.find((p) => p.id === action.payload.projectId);
      if (!proj) return `⚠️ Projeto não encontrado`;
      const updatedTasks = proj.tasks.map((t) =>
        t.id === action.payload.taskId ? { ...t, done: true } : t
      );
      const progress = Math.round((updatedTasks.filter((t) => t.done).length / updatedTasks.length) * 100);
      await db.updateProject(proj.id, { tasks: updatedTasks, progress });
      useUserStore.getState().addXP(10, 'focus');
      if (progress === 100) useUserStore.getState().addXP(50, 'discipline');
      return `✅ Subtarefa concluída (${proj.title} — ${progress}%)`;
    }

    case 'DELETE_ROUTINE_BLOCK': {
      await db.deleteRoutineBlock(action.payload.blockId);
      return `🗑️ Bloco de rotina removido`;
    }

    default:
      return `⚠️ Ação desconhecida`;
  }
}
