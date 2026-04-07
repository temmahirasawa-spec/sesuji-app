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

// localStorageのみに保存（クラウドから取得したデータのキャッシュ用）
export const localSaveTasks = (key: string, tasks: Task[]) => {
  localSave(STORAGE_KEY, key, tasks);
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
// Daily Ratings
// ============================

const RATINGS_STORAGE_KEY = 'sesuji_week_ratings';

export const loadRatings = (date: string): { [key: string]: number } | null =>
  localLoad(RATINGS_STORAGE_KEY, date);

export const saveRatings = (date: string, ratings: { [key: string]: number }) => {
  localSave(RATINGS_STORAGE_KEY, date, ratings);
  cloudSave(`ratings_${date}`, ratings);
};

export const loadRatingsCloud = async (date: string): Promise<{ [key: string]: number } | null> => {
  return await cloudLoad(`ratings_${date}`);
};

// ============================
// Training Day Flag
// ============================

const TRAINING_KEY = 'sesuji_training';

export const loadTrainingDay = (date: string): boolean | null => {
  const v = localLoad(TRAINING_KEY, date);
  if (v === null) return null; // not yet chosen
  return v === true;
};

export const saveTrainingDay = (date: string, isTraining: boolean) => {
  localSave(TRAINING_KEY, date, isTraining);
  cloudSave(`training_${date}`, isTraining);
};

export const loadTrainingDayCloud = async (date: string): Promise<boolean | null> => {
  const v = await cloudLoad(`training_${date}`);
  return v === null ? null : v === true;
};

// ============================
// Comments (daily / weekly diary)
// ============================

const COMMENTS_KEY = 'sesuji_comments';

export const loadComment = (key: string): string | null =>
  localLoad(COMMENTS_KEY, key);

export const saveComment = (key: string, text: string) => {
  localSave(COMMENTS_KEY, key, text);
  cloudSave(`comment_${key}`, text);
};

export const loadCommentCloud = async (key: string): Promise<string | null> =>
  await cloudLoad(`comment_${key}`);

// ============================
// AI Reviews
// ============================

const REVIEWS_KEY = 'sesuji_reviews';

export const loadReview = (key: string): string | null =>
  localLoad(REVIEWS_KEY, key);

export const saveReview = (key: string, text: string) => {
  localSave(REVIEWS_KEY, key, text);
  cloudSave(`review_${key}`, text);
};

export const loadReviewCloud = async (key: string): Promise<string | null> =>
  await cloudLoad(`review_${key}`);

// ============================
// Merge
// ============================

// savedがあればそのまま使う（順序・削除・完了すべて保持）
// savedがなければデフォルトを初期値として使う
export const mergeTasks = (defaults: Task[], saved: Task[] | null): Task[] => {
  if (!saved) return defaults.map(t => ({ ...t }));
  return saved.map(t => ({ ...t }));
};
