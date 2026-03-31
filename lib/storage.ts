import { Task } from './types';

const STORAGE_KEY = 'sesuji_week_tasks';
const TIME_STORAGE_KEY = 'sesuji_week_times';

export const loadTasks = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const all = JSON.parse(data);
    return all[key] || null;
  } catch {
    return null;
  }
};

export const saveTasks = (key: string, tasks: Task[]) => {
  if (typeof window === 'undefined') return;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const all = data ? JSON.parse(data) : {};
    all[key] = tasks;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
};

/**
 * 最新のタスク定義と保存済みのチェック状態をマージする。
 * - 新しいタスクが追加されていたら未完了で追加
 * - 削除されたタスクは除外
 * - 既存タスクのcompleted状態は保持
 */
export const mergeTasks = (defaults: Task[], saved: Task[] | null): Task[] => {
  if (!saved || saved.length === 0) return defaults.map(t => ({ ...t }));

  const savedMap = new Map<number, boolean>();
  saved.forEach(t => savedMap.set(t.id, t.completed));

  return defaults.map(t => ({
    ...t,
    completed: savedMap.has(t.id) ? savedMap.get(t.id)! : false,
  }));
};

export const loadTimeRecord = (date: string, type: 'wakeup' | 'sleep') => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(TIME_STORAGE_KEY);
    if (!data) return null;
    const all = JSON.parse(data);
    return all[`${date}_${type}`] || null;
  } catch {
    return null;
  }
};

export const saveTimeRecord = (date: string, type: 'wakeup' | 'sleep', actual: string) => {
  if (typeof window === 'undefined') return;
  try {
    const data = localStorage.getItem(TIME_STORAGE_KEY);
    const all = data ? JSON.parse(data) : {};
    all[`${date}_${type}`] = actual;
    localStorage.setItem(TIME_STORAGE_KEY, JSON.stringify(all));
  } catch {}
};
