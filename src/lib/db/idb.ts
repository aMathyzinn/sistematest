import { openDB, DBSchema, IDBPDatabase } from 'idb';
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
// SCHEMA DO INDEXEDDB
// ============================================================

interface SistemaDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by-status': string;
      'by-category': string;
      'by-date': string;
    };
  };
  missions: {
    key: string;
    value: Mission;
    indexes: {
      'by-date': string;
      'by-status': string;
      'by-type': string;
    };
  };
  chat_channels: {
    key: string;
    value: ChatChannel;
    indexes: {
      'by-last-message': string;
    };
  };
  chat_messages: {
    key: string;
    value: ChatMessage;
    indexes: {
      'by-channel': string;
      'by-date': string;
    };
  };
  routine_blocks: {
    key: string;
    value: RoutineBlock;
    indexes: {
      'by-start': string;
    };
  };
  alarms: {
    key: string;
    value: Alarm;
  };
  daily_logs: {
    key: string;
    value: DailyLog;
    indexes: {
      'by-date': string;
    };
  };
  pomodoro_sessions: {
    key: string;
    value: PomodoroSession;
    indexes: {
      'by-date': string;
    };
  };
}

const DB_NAME = 'sistema-evolucao';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SistemaDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SistemaDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB não disponível no servidor'));
  }

  if (!dbPromise) {
    dbPromise = openDB<SistemaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tasks
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-status', 'status');
        taskStore.createIndex('by-category', 'category');
        taskStore.createIndex('by-date', 'createdAt');

        // Missions
        const missionStore = db.createObjectStore('missions', { keyPath: 'id' });
        missionStore.createIndex('by-date', 'date');
        missionStore.createIndex('by-status', 'status');
        missionStore.createIndex('by-type', 'type');

        // Chat Channels
        const channelStore = db.createObjectStore('chat_channels', { keyPath: 'id' });
        channelStore.createIndex('by-last-message', 'lastMessageAt');

        // Chat Messages
        const messageStore = db.createObjectStore('chat_messages', { keyPath: 'id' });
        messageStore.createIndex('by-channel', 'channelId');
        messageStore.createIndex('by-date', 'createdAt');

        // Routine Blocks
        const routineStore = db.createObjectStore('routine_blocks', { keyPath: 'id' });
        routineStore.createIndex('by-start', 'startTime');

        // Alarms
        db.createObjectStore('alarms', { keyPath: 'id' });

        // Daily Logs
        const logStore = db.createObjectStore('daily_logs', { keyPath: 'id' });
        logStore.createIndex('by-date', 'date');

        // Pomodoro Sessions
        const pomodoroStore = db.createObjectStore('pomodoro_sessions', { keyPath: 'id' });
        pomodoroStore.createIndex('by-date', 'startedAt');
      },
    });
  }

  return dbPromise;
}
