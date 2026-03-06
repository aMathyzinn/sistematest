import { v4 as uuidv4 } from 'uuid';
import type { AIAction, AIResponse, UserAttributes } from '@/lib/types';
import { useUserStore } from '@/stores/userStore';
import { useUIStore } from '@/stores/uiStore';
import * as db from '@/lib/db/queries';

// ============================================================
// PARSER DE RESPOSTA DA IA
// ============================================================

export function parseAIResponse(rawText: string): AIResponse {
  try {
    // Tentar extrair JSON de dentro da resposta
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { message: rawText, actions: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      message: parsed.message || rawText,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    };
  } catch {
    // Se não conseguir parsear, retornar como mensagem simples
    return { message: rawText, actions: [] };
  }
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
  switch (action.type) {
    case 'CREATE_TASK': {
      const task = await db.addTask({
        title: action.payload.title,
        description: action.payload.description || '',
        category: action.payload.category || 'custom',
        priority: action.payload.priority || 'medium',
        status: 'pending',
        xpReward: action.payload.xpReward || 20,
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
      const mission = await db.addMission({
        title: action.payload.title,
        description: action.payload.description || '',
        type: action.payload.type,
        status: 'pending',
        xpReward: action.payload.xpReward || 30,
        attributeBonus: action.payload.attributeBonus || {},
        target: action.payload.target,
        progress: 0,
        date: today,
      });
      return `⚔️ Missão criada: ${mission.title}`;
    }

    case 'AWARD_XP': {
      const attr = action.payload.attribute as keyof UserAttributes | undefined;
      useUserStore.getState().addXP(action.payload.amount, attr);
      const today = new Date().toISOString().split('T')[0];
      const log = await db.getDailyLog(today);
      await db.upsertDailyLog(today, {
        xpEarned: (log?.xpEarned || 0) + action.payload.amount,
      });
      return `⭐ +${action.payload.amount} XP${attr ? ` (${attr})` : ''}`;
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

    default:
      return `⚠️ Ação desconhecida`;
  }
}
