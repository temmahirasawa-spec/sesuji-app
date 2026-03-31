import { Task } from './types';
import { cloudLoad, cloudSave } from './supabase';

// ============================
// localStorage (instant cache)
// ============================

const STORAGE_KEY = 'sesuji_week_tasks';
const TIME_STORAGE_KEY = 'sesuji_week_times';

const localLoad = (store: string, key: string): any | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(store);
    if (!data) return null;
    return JSON.parse(data)[key] || null;
  } catch { return null; }
};

const localSave = (store: string, key: string, value: any) => {
  if (typeof window === 'undefined') return;
  try {
    const data = localStorage.getItem(store);
    const all = data ? JSON.parse(data) : {};
    all[key] = value;
    localStorage.setItem(store, JSON.stringify(all));
  } catch {}
};

// ============================
// Tasks
// ============================

export const loadTasks = (key: string) => localLoad(STORAGE_KEY, key);

export const saveTasks = (key: string, tasks: Task[]) => {
  localSave(STORAGE_KEY, key, tasks);
  cloudSave(`tasks_${key}`, tasks);
};

export const loadTasksCloud = async (key: string): Promise<Task[] | null> => {
  return await cloudLoad(`tasks_${key}`);
};

// ============================
// Time records
// ============================

export const loadTimeRecord = (date: string, type: 'wakeup' | 'sleep') =>
  localLoad(TIME_STORAGE_KEY, `${date}_${type}`);

export const saveTimeRecord = (date: string, type: 'wakeup' | 'sleep', actual: string) => {
  const key = `${date}_${type}`;
  localSave(TIME_STORAGE_KEY, key, actual);
  cloudSave(`time_${key}`, actual);
};

export const loadTimeRecordCloud = async (date: string, type: 'wakeup' | 'sleep'): Promise<string | null> => {
  return await cloudLoad(`time_${date}_${type}`);
};

// ============================
// Merge
// ============================

export const mergeTasks = (defaults: Task[], saved: Task[] | null): Task[] => {
  if (!saved || saved.length === 0) return defaults.map(t => ({ ...t }));

  // If saved has custom tasks (added by user), keep them
  const defaultIds = new Set(defaults.map(t => t.id));
  const customTasks = saved.filter(t => !defaultIds.has(t.id));

  const savedMap = new Map<number, Task>();
  saved.forEach(t => savedMap.set(t.id, t));

  const merged = defaults.map(t => {
    const s = savedMap.get(t.id);
    return s ? { ...t, completed: s.completed, text: s.text } : { ...t };
  });

  return [...merged, ...customTasks];
};
