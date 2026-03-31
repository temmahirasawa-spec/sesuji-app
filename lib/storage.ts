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

export const saveTasks = (key: string, tasks: any[]) => {
  if (typeof window === 'undefined') return;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const all = data ? JSON.parse(data) : {};
    all[key] = tasks;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
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
