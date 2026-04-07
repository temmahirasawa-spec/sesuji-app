'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Task, TaskStatus, DayPlan } from '@/lib/types';
import { saveTasks, loadTasks, localSaveTasks, mergeTasks, saveTimeRecord, loadTimeRecord, loadTasksCloud, loadTimeRecordCloud, loadRatings, saveRatings, loadRatingsCloud, loadComment, saveComment, loadCommentCloud, loadReview, saveReview, loadReviewCloud } from '@/lib/storage';
import { inspirations } from '@/lib/inspirations';
import { ParsedTask } from '@/types/taskParsing';
import VoiceInput from './components/VoiceInput';
import styles from './page.module.css';

const SortableTaskList = dynamic(() => import('./SortableTaskList'), { ssr: false });

// ============================
// GOALS（大目標）
// ============================
const WEEKLY_GOALS = [
  '禁欲',
  '23時まで禁煙',
  '仕事中にプライベートなネットサーフィン・動画視聴をしない',
  '空いた時間は家事（掃除・洗濯・洗い物）をする',
];

// ============================
// DAILY ROUTINE（全日共通・時系列）
// ============================
const makeDailyTasks = (date: string): Task[] => {
  const hasBodySkincare = !['3/31', '4/1'].includes(date); // 4/2以降すべて

  const tasks: Task[] = [
    // Morning
    { id: 201, text: 'サプリメント摂取（朝）', completed: false, category: 'morning' },
    { id: 202, text: '日焼けをする', completed: false, category: 'morning' },
    // Work
    { id: 301, text: '仕事中プライベート禁止（SNS・動画など）', completed: false, category: 'work' },
    // Evening
    { id: 402, text: 'サプリメント摂取（夜：プロテイン・グルタミン）', completed: false, category: 'evening' },
    // Night
    { id: 501, text: 'ボディケア（乳液・ケアセラ・ホホバ）', completed: false, category: 'night' },
    { id: 502, text: '禁欲', completed: false, category: 'night' },
    { id: 503, text: '深夜スマホ禁止', completed: false, category: 'night' },
    { id: 504, text: '23:00 全タスク完了（以降のみ喫煙可）', completed: false, category: 'night' },
  ];

  // スキンケアは4/2（水）から
  if (hasBodySkincare) {
    tasks.splice(1, 0, { id: 203, text: 'スキンケア（朝：洗顔・ビュッフェ）', completed: false, category: 'morning' });
    tasks.splice(tasks.findIndex(t => t.id === 501), 0, { id: 500, text: 'スキンケア（夜：AHA洗顔・レチノイド）', completed: false, category: 'night' });
  }

  return tasks;
};

// ============================
// WEEK DATA（日別タスク・時系列）
// ============================
const WEEK_DATA: { [key: string]: DayPlan } = {
  '3/31': {
    date: '3/31',
    day: '火',
    focus: 'システム・リセット',
    inspiration: inspirations['3/31'].description,
    todayTasks: [
      { id: 1, text: '申告書の再提出', completed: false, category: 'morning' },
      { id: 2, text: '消費税の支払い', completed: false, category: 'morning' },
      { id: 3, text: 'YORKYSブランチのメニュー部分構築', completed: false, category: 'work' },
      { id: 6, text: 'YORKYS FROMAのカード修正', completed: false, category: 'work' },
      { id: 5, text: '日焼け', completed: false, category: 'evening' },
    ],
    dailyTasks: [],
    goals: WEEKLY_GOALS,
    milestoneTitle: inspirations['3/31'].milestone,
    milestoneDescription: inspirations['3/31'].story,
  },
  '4/1': {
    date: '4/1',
    day: '水',
    focus: 'Training Day 1',
    inspiration: inspirations['4/1'].description,
    todayTasks: [
      { id: 1, text: 'サプリ・機材の発注', completed: false, category: 'morning' },
      { id: 2, text: '筋トレ：背面（デッドリフト）', completed: false, category: 'evening' },
      { id: 3, text: 'レチノイド開始', completed: false, category: 'night' },
    ],
    dailyTasks: [],
    goals: WEEKLY_GOALS,
    milestoneTitle: inspirations['4/1'].milestone,
    milestoneDescription: inspirations['4/1'].story,
  },
  '4/2': {
    date: '4/2',
    day: '木',
    focus: 'Deep Work',
    inspiration: inspirations['4/2'].description,
    todayTasks: [
      { id: 1, text: '09:00-12:00 重要タスク3時間', completed: false, category: 'work' },
      { id: 2, text: 'スキンケア商品受取・開始', completed: false, category: 'evening' },
      { id: 3, text: 'セックス判定（Option A）', completed: false, category: 'night' },
    ],
    dailyTasks: [],
    goals: WEEKLY_GOALS,
    milestoneTitle: inspirations['4/2'].milestone,
    milestoneDescription: inspirations['4/2'].story,
  },
  '4/3': {
    date: '4/3',
    day: '金',
    focus: 'Recovery',
    inspiration: inspirations['4/3'].description,
    todayTasks: [
      { id: 1, text: 'ミヤリサン（腸内デバッグ）', completed: false, category: 'morning' },
      { id: 2, text: '仕事の詰まり解消', completed: false, category: 'work' },
    ],
    dailyTasks: [],
    goals: WEEKLY_GOALS,
    milestoneTitle: inspirations['4/3'].milestone,
    milestoneDescription: inspirations['4/3'].story,
  },
  '4/4': {
    date: '4/4',
    day: '土',
    focus: 'Training Day 2',
    inspiration: inspirations['4/4'].description,
    todayTasks: [
      { id: 1, text: '筋トレ：全身/背面', completed: false, category: 'evening' },
      { id: 2, text: '16kgダンベルの質を追求', completed: false, category: 'evening' },
      { id: 3, text: 'セックス可能（Option B）', completed: false, category: 'night' },
    ],
    dailyTasks: [],
    goals: WEEKLY_GOALS,
    milestoneTitle: inspirations['4/4'].milestone,
    milestoneDescription: inspirations['4/4'].story,
  },
  '4/5': {
    date: '4/5',
    day: '日',
    focus: 'Maintenance',
    inspiration: inspirations['4/5'].description,
    todayTasks: [
      { id: 1, text: '銭湯 + Ma:nyo オイルデトックス', completed: false, category: 'evening' },
      { id: 2, text: '精悍さを固定', completed: false, category: 'evening' },
      { id: 3, text: 'サイリウム + 水分2L', completed: false, category: 'morning' },
    ],
    dailyTasks: [],
    goals: WEEKLY_GOALS,
    milestoneTitle: inspirations['4/5'].milestone,
    milestoneDescription: inspirations['4/5'].story,
  },
  '4/6': {
    date: '4/6',
    day: '月',
    focus: 'Review',
    inspiration: inspirations['4/6'].description,
    todayTasks: [
      { id: 1, text: '腹の締まりを確認', completed: false, category: 'morning' },
      { id: 2, text: 'おでこのポツポツをチェック', completed: false, category: 'morning' },
      { id: 3, text: '仕事の進捗を査定', completed: false, category: 'work' },
      { id: 4, text: '次週へのOSアップデート', completed: false, category: 'night' },
    ],
    dailyTasks: [],
    goals: WEEKLY_GOALS,
    milestoneTitle: inspirations['4/6'].milestone,
    milestoneDescription: inspirations['4/6'].story,
  },
  '4/7': {
    date: '4/7', day: '火', focus: '新週スタート',
    inspiration: inspirations['4/7'].description, todayTasks: [], dailyTasks: [],
    goals: WEEKLY_GOALS, milestoneTitle: inspirations['4/7'].milestone, milestoneDescription: inspirations['4/7'].story,
  },
  '4/8': {
    date: '4/8', day: '水', focus: 'Deep Work Day',
    inspiration: inspirations['4/8'].description, todayTasks: [], dailyTasks: [],
    goals: WEEKLY_GOALS, milestoneTitle: inspirations['4/8'].milestone, milestoneDescription: inspirations['4/8'].story,
  },
  '4/9': {
    date: '4/9', day: '木', focus: 'ビルドデー',
    inspiration: inspirations['4/9'].description, todayTasks: [], dailyTasks: [],
    goals: WEEKLY_GOALS, milestoneTitle: inspirations['4/9'].milestone, milestoneDescription: inspirations['4/9'].story,
  },
  '4/10': {
    date: '4/10', day: '金', focus: 'リカバリー＆調整',
    inspiration: inspirations['4/10'].description, todayTasks: [], dailyTasks: [],
    goals: WEEKLY_GOALS, milestoneTitle: inspirations['4/10'].milestone, milestoneDescription: inspirations['4/10'].story,
  },
  '4/11': {
    date: '4/11', day: '土', focus: 'トレーニングデー',
    inspiration: inspirations['4/11'].description, todayTasks: [], dailyTasks: [],
    goals: WEEKLY_GOALS, milestoneTitle: inspirations['4/11'].milestone, milestoneDescription: inspirations['4/11'].story,
  },
  '4/12': {
    date: '4/12', day: '日', focus: '自由時間の設計',
    inspiration: inspirations['4/12'].description, todayTasks: [], dailyTasks: [],
    goals: WEEKLY_GOALS, milestoneTitle: inspirations['4/12'].milestone, milestoneDescription: inspirations['4/12'].story,
  },
  '4/13': {
    date: '4/13', day: '月', focus: 'Week 2 レビュー',
    inspiration: inspirations['4/13'].description, todayTasks: [], dailyTasks: [],
    goals: WEEKLY_GOALS, milestoneTitle: inspirations['4/13'].milestone, milestoneDescription: inspirations['4/13'].story,
  },
};

const CATEGORY_LABELS: { [key: string]: { label: string; icon: string } } = {
  morning: { label: 'MORNING', icon: '☀️' },
  work: { label: 'WORK', icon: '💻' },
  evening: { label: 'EVENING', icon: '🏋' },
  night: { label: 'NIGHT', icon: '🌙' },
};

const CATEGORY_ORDER = ['morning', 'work', 'evening', 'night'];

type ViewMode = 'day' | 'list';

const RATING_CATEGORIES: { key: string; label: string; type: 'score' | 'boolean' }[] = [
  { key: 'sleep', label: '睡眠', type: 'score' },
  { key: 'work', label: '仕事', type: 'score' },
  { key: 'sex', label: '性', type: 'boolean' },
  { key: 'food', label: '食事', type: 'score' },
  { key: 'skincare', label: 'スキン・ボディケア', type: 'score' },
  { key: 'exercise', label: '運動', type: 'boolean' },
  { key: 'overall', label: '総合', type: 'score' },
];

interface Celebration {
  id: string;
  x: number;
  y: number;
}

function calcTimeDiff(target: string, actual: string): string {
  if (!actual) return '';
  const [th, tm] = target.split(':').map(Number);
  const [ah, am] = actual.split(':').map(Number);
  const diffMin = (ah * 60 + am) - (th * 60 + tm);
  if (diffMin === 0) return 'on time';
  const sign = diffMin > 0 ? '+' : '-';
  const abs = Math.abs(diffMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h > 0 && m > 0) return `${sign}${h}h${m}m`;
  if (h > 0) return `${sign}${h}h`;
  return `${sign}${m}m`;
}

export default function Home() {
  const [weekTasks, setWeekTasks] = useState<{ [key: string]: { today: Task[]; daily: Task[] } }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const key = `${now.getMonth() + 1}/${now.getDate()}`;
    const dates = Object.keys(WEEK_DATA);
    return dates.includes(key) ? key : dates[0];
  });
  const [timeRecords, setTimeRecords] = useState<{ [key: string]: string }>({});
  const [editingTask, setEditingTask] = useState<{ date: string; id: number; type: 'today' | 'daily' } | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState<'morning' | 'work' | 'evening' | 'night'>('morning');
  const [editMemo, setEditMemo] = useState('');
  const [addingTo, setAddingTo] = useState<{ date: string; type: 'today' | 'daily' } | null>(null);
  const [addText, setAddText] = useState('');
  const [addMemo, setAddMemo] = useState('');
  const [addCategory, setAddCategory] = useState<'morning' | 'work' | 'evening' | 'night'>('work');
  const [dayRatings, setDayRatings] = useState<{ [date: string]: { [key: string]: number } }>({});
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // 0-indexed
  });
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [reviews, setReviews] = useState<{ [key: string]: string }>({});
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);

  useEffect(() => {
    // 1. まずlocalStorageから即座に表示
    const loaded: { [key: string]: { today: Task[]; daily: Task[] } } = {};
    const times: { [key: string]: string } = {};
    const dates = Object.keys(WEEK_DATA);

    // 3/31のdailyルーティンをテンプレートとして取得
    const baseDaily = loadTasks('3/31_daily');
    const ratings: { [date: string]: { [key: string]: number } } = {};
    const localComments: { [key: string]: string } = {};
    const localReviews: { [key: string]: string } = {};

    // 3/31のルーティン構成（タスクのリスト）を他の日にも反映
    // 各日の完了状態は個別に保持する
    const syncVersion = localStorage.getItem('sesuji_daily_sync_v') || '0';
    const currentSyncVersion = '2'; // バージョンを上げると全日に再同期

    dates.forEach(date => {
      const savedToday = loadTasks(`${date}_today`);
      const savedDaily = loadTasks(`${date}_daily`);

      let daily: Task[];
      if (date === '3/31') {
        // 3/31はそのまま
        daily = savedDaily ? mergeTasks(makeDailyTasks(date), savedDaily) : mergeTasks(makeDailyTasks(date), null);
      } else if (baseDaily && syncVersion !== currentSyncVersion) {
        // 3/31のルーティン構成を反映（完了状態は各日のものを保持）
        const existingMap = new Map<number, Task>();
        if (savedDaily) savedDaily.forEach((t: Task) => existingMap.set(t.id, t));
        daily = baseDaily.map((t: Task) => {
          const existing = existingMap.get(t.id);
          return { ...t, completed: existing?.completed ?? false, status: existing?.status ?? undefined };
        });
        saveTasks(`${date}_daily`, daily);
      } else if (savedDaily) {
        daily = mergeTasks(makeDailyTasks(date), savedDaily);
      } else if (baseDaily) {
        daily = baseDaily.map((t: Task) => ({ ...t, completed: false, status: undefined }));
        saveTasks(`${date}_daily`, daily);
      } else {
        daily = mergeTasks(makeDailyTasks(date), null);
      }

      loaded[date] = {
        today: mergeTasks(WEEK_DATA[date].todayTasks, savedToday),
        daily,
      };
      const wakeup = loadTimeRecord(date, 'wakeup');
      const sleep = loadTimeRecord(date, 'sleep');
      if (wakeup) times[`${date}_wakeup`] = wakeup;
      if (sleep) times[`${date}_sleep`] = sleep;

      // 評価データ読み込み
      const r = loadRatings(date);
      if (r) ratings[date] = r;

      // コメント・レビュー読み込み
      const c = loadComment(`day_${date}`);
      if (c) localComments[`day_${date}`] = c;
      const rv = loadReview(`day_${date}`);
      if (rv) localReviews[`day_${date}`] = rv;
    });

    if (syncVersion !== currentSyncVersion) {
      localStorage.setItem('sesuji_daily_sync_v', currentSyncVersion);
    }
    // 週間コメント・レビュー
    const wc = loadComment('weekly');
    if (wc) localComments['weekly'] = wc;
    const wr = loadReview('weekly');
    if (wr) localReviews['weekly'] = wr;

    setWeekTasks(loaded);
    setTimeRecords(times);
    setDayRatings(ratings);
    setComments(localComments);
    setReviews(localReviews);
    setIsLoaded(true);
    updateProgress(loaded);

    // 2. クラウドから最新データを取得して上書き（他デバイスとの同期）
    (async () => {
      const cloudLoaded: { [key: string]: { today: Task[]; daily: Task[] } } = {};
      const cloudTimes: { [key: string]: string } = {};
      const cloudRatings: { [date: string]: { [key: string]: number } } = {};
      let hasCloudData = false;

      for (const date of dates) {
        const cloudToday = await loadTasksCloud(`${date}_today`);
        const cloudDaily = await loadTasksCloud(`${date}_daily`);

        // クラウドデータがあればそのまま使う（デフォルトとマージしない）
        const today = cloudToday
          ? cloudToday.map((t: Task) => ({ ...t }))
          : loaded[date].today;
        const daily = cloudDaily
          ? cloudDaily.map((t: Task) => ({ ...t }))
          : loaded[date].daily;

        cloudLoaded[date] = { today, daily };

        if (cloudToday || cloudDaily) {
          hasCloudData = true;
          // クラウドデータをlocalStorageにも保存して同期
          if (cloudToday) localSaveTasks(`${date}_today`, cloudToday);
          if (cloudDaily) localSaveTasks(`${date}_daily`, cloudDaily);
        }

        const cloudWakeup = await loadTimeRecordCloud(date, 'wakeup');
        const cloudSleep = await loadTimeRecordCloud(date, 'sleep');
        if (cloudWakeup) { cloudTimes[`${date}_wakeup`] = cloudWakeup; hasCloudData = true; }
        else if (times[`${date}_wakeup`]) cloudTimes[`${date}_wakeup`] = times[`${date}_wakeup`];
        if (cloudSleep) { cloudTimes[`${date}_sleep`] = cloudSleep; hasCloudData = true; }
        else if (times[`${date}_sleep`]) cloudTimes[`${date}_sleep`] = times[`${date}_sleep`];

        const cloudRating = await loadRatingsCloud(date);
        if (cloudRating) {
          cloudRatings[date] = cloudRating;
          hasCloudData = true;
        } else if (ratings[date]) {
          cloudRatings[date] = ratings[date];
        }
      }

      // クラウドからコメント・レビューも同期
      const cloudComments: { [key: string]: string } = { ...localComments };
      const cloudReviewsData: { [key: string]: string } = { ...localReviews };
      for (const d of dates) {
        const cc = await loadCommentCloud(`day_${d}`);
        if (cc) cloudComments[`day_${d}`] = cc;
        const cr = await loadReviewCloud(`day_${d}`);
        if (cr) cloudReviewsData[`day_${d}`] = cr;
      }
      const wcCloud = await loadCommentCloud('weekly');
      if (wcCloud) cloudComments['weekly'] = wcCloud;
      const wrCloud = await loadReviewCloud('weekly');
      if (wrCloud) cloudReviewsData['weekly'] = wrCloud;

      if (hasCloudData) {
        setWeekTasks(cloudLoaded);
        setTimeRecords(cloudTimes);
        if (Object.keys(cloudRatings).length > 0) setDayRatings(cloudRatings);
        updateProgress(cloudLoaded);
      }
      setComments(cloudComments);
      setReviews(cloudReviewsData);
    })();
  }, []);

  const getTaskStatus = (task: Task): TaskStatus => task.status || (task.completed ? 'done' : 'pending');

  const updateProgress = useCallback((tasks: { [key: string]: { today: Task[]; daily: Task[] } }) => {
    let total = 0;
    let resolved = 0;
    Object.keys(tasks).forEach(date => {
      [...tasks[date].today, ...tasks[date].daily].forEach(task => {
        total++;
        const s = task.status || (task.completed ? 'done' : 'pending');
        if (s === 'done' || s === 'failed') resolved++;
      });
    });
    setTotalProgress(total === 0 ? 0 : Math.round((resolved / total) * 100));
  }, []);

  const setTaskStatus = (date: string, taskId: number, type: 'today' | 'daily', status: TaskStatus) => {
    const newTasks = { ...weekTasks };
    const taskList = type === 'today' ? newTasks[date].today : newTasks[date].daily;
    const task = taskList.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.completed = status === 'done';
      setWeekTasks({ ...newTasks });
      saveTasks(`${date}_${type}`, taskList);
      updateProgress(newTasks);
    }
  };

  const addTask = (date: string, type: 'today' | 'daily', text: string, category: 'morning' | 'work' | 'evening' | 'night', memo?: string) => {
    const newTasks = { ...weekTasks };
    const taskList = type === 'today' ? newTasks[date].today : newTasks[date].daily;
    const maxId = taskList.length > 0 ? Math.max(...taskList.map(t => t.id)) : 0;
    taskList.push({ id: maxId + 1, text, completed: false, category, memo: memo || undefined });
    setWeekTasks({ ...newTasks });
    saveTasks(`${date}_${type}`, taskList);
    updateProgress(newTasks);
  };

  const editTask = (date: string, taskId: number, type: 'today' | 'daily', newText: string, newCategory?: 'morning' | 'work' | 'evening' | 'night', newMemo?: string) => {
    const newTasks = { ...weekTasks };
    const taskList = type === 'today' ? newTasks[date].today : newTasks[date].daily;
    const task = taskList.find(t => t.id === taskId);
    if (task) {
      task.text = newText;
      if (newCategory) task.category = newCategory;
      task.memo = newMemo || undefined;
      setWeekTasks({ ...newTasks });
      saveTasks(`${date}_${type}`, taskList);
    }
  };

  const updateTaskMemo = (date: string, taskId: number, type: 'today' | 'daily', memo: string) => {
    const newTasks = { ...weekTasks };
    const taskList = type === 'today' ? newTasks[date].today : newTasks[date].daily;
    const task = taskList.find(t => t.id === taskId);
    if (task) {
      task.memo = memo.trim() || undefined;
      setWeekTasks({ ...newTasks });
      saveTasks(`${date}_${type}`, taskList);
    }
  };

  const deleteTask = (date: string, taskId: number, type: 'today' | 'daily') => {
    const newTasks = { ...weekTasks };
    if (type === 'today') {
      newTasks[date].today = newTasks[date].today.filter(t => t.id !== taskId);
    } else {
      newTasks[date].daily = newTasks[date].daily.filter(t => t.id !== taskId);
    }
    setWeekTasks({ ...newTasks });
    saveTasks(`${date}_${type}`, type === 'today' ? newTasks[date].today : newTasks[date].daily);
    updateProgress(newTasks);
  };

  const createCelebration = (e: React.MouseEvent) => {
    const id = Math.random().toString(36).substring(2, 11);
    setCelebrations(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setCelebrations(prev => prev.filter(c => c.id !== id)), 1000);
  };

  const handleTimeChange = (date: string, type: 'wakeup' | 'sleep', value: string) => {
    const key = `${date}_${type}`;
    setTimeRecords(prev => ({ ...prev, [key]: value }));
    saveTimeRecord(date, type, value);
  };

  const getDayProgress = (date: string) => {
    const t = weekTasks[date];
    if (!t) return 0;
    const all = [...t.today, ...t.daily];
    if (all.length === 0) return 0;
    const resolved = all.filter(t => { const s = t.status || (t.completed ? 'done' : 'pending'); return s === 'done' || s === 'failed'; }).length;
    return Math.round((resolved / all.length) * 100);
  };

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  const dates = Object.keys(WEEK_DATA);

  const startEdit = (date: string, id: number, type: 'today' | 'daily', text: string, category?: string, memo?: string) => {
    setEditingTask({ date, id, type });
    setEditText(text);
    setEditCategory((category as any) || 'morning');
    setEditMemo(memo || '');
  };

  const submitEdit = () => {
    if (editingTask && editText.trim()) {
      editTask(editingTask.date, editingTask.id, editingTask.type, editText.trim(), editCategory, editMemo);
    }
    setEditingTask(null);
    setEditText('');
    setEditMemo('');
  };

  const startAdd = (date: string, type: 'today' | 'daily') => {
    setAddingTo({ date, type });
    setAddText('');
    setAddMemo('');
    setAddCategory('work');
  };

  const submitAdd = () => {
    if (addingTo && addText.trim()) {
      addTask(addingTo.date, addingTo.type, addText.trim(), addCategory, addMemo);
    }
    setAddingTo(null);
    setAddText('');
    setAddMemo('');
  };

  const getPrevDate = (date: string): string | null => {
    const allDates = Object.keys(WEEK_DATA);
    const idx = allDates.indexOf(date);
    return idx > 0 ? allDates[idx - 1] : null;
  };

  const carryOverFromPrevDay = (date: string) => {
    const prevDate = getPrevDate(date);
    if (!prevDate || !weekTasks[prevDate]) return;

    const prevTodayIncomplete = weekTasks[prevDate].today.filter(t => {
      const s = t.status || (t.completed ? 'done' : 'pending');
      return s === 'pending';
    });

    if (prevTodayIncomplete.length === 0) return;

    const newTasks = { ...weekTasks };
    const todayList = [...newTasks[date].today];
    const maxId = todayList.length > 0 ? Math.max(...todayList.map(t => t.id)) : 0;
    const existingTexts = new Set(todayList.map(t => t.text));

    let added = 0;
    prevTodayIncomplete.forEach((t, i) => {
      if (existingTexts.has(t.text)) return;
      todayList.push({
        id: maxId + 1 + added,
        text: t.text,
        completed: false,
        category: t.category,
        memo: t.memo,
      });
      added++;
    });

    if (added === 0) return;

    newTasks[date] = { ...newTasks[date], today: todayList };
    setWeekTasks({ ...newTasks });
    saveTasks(`${date}_today`, todayList);
    updateProgress(newTasks);
  };

  const handleCommentChange = (key: string, text: string) => {
    setComments(prev => ({ ...prev, [key]: text }));
    saveComment(key, text);
  };

  const requestAIReview = async (key: string, type: 'daily' | 'weekly') => {
    setReviewLoading(key);
    try {
      let data = '';
      if (type === 'daily') {
        const date = key.replace('day_', '');
        const t = weekTasks[date];
        if (t) {
          const allTasks = [...t.today, ...t.daily];
          const done = allTasks.filter(t => (t.status || (t.completed ? 'done' : 'pending')) === 'done');
          const failed = allTasks.filter(t => (t.status || (t.completed ? 'done' : 'pending')) === 'failed');
          const pending = allTasks.filter(t => (t.status || (t.completed ? 'done' : 'pending')) === 'pending');
          data = `日付: ${date}\n完了: ${done.map(t => t.text).join(', ') || 'なし'}\n未達: ${failed.map(t => t.text).join(', ') || 'なし'}\n未着手: ${pending.map(t => t.text).join(', ') || 'なし'}`;
          const rating = dayRatings[date];
          if (rating) data += `\n評価: ${JSON.stringify(rating)}`;
          const comment = comments[`day_${date}`];
          if (comment) data += `\n本人コメント: ${comment}`;
        }
      } else {
        // 選択中の日曜日を基準に、その週の月〜日のデータのみ使う
        const allDates = Object.keys(WEEK_DATA);
        const sundayIdx = allDates.indexOf(selectedDate);
        // 日曜から遡って最大7日分（月〜日）
        const weekDates: string[] = [];
        for (let i = Math.max(0, sundayIdx - 6); i <= sundayIdx && i < allDates.length; i++) {
          weekDates.push(allDates[i]);
        }
        const lines: string[] = [];
        lines.push(`対象期間: ${weekDates[0]} 〜 ${weekDates[weekDates.length - 1]}`);
        weekDates.forEach(d => {
          const t = weekTasks[d];
          if (!t) return;
          const all = [...t.today, ...t.daily];
          const done = all.filter(t => (t.status || (t.completed ? 'done' : 'pending')) === 'done').length;
          const failed = all.filter(t => t.status === 'failed').length;
          const total = all.length;
          const dayInfo = WEEK_DATA[d];
          lines.push(`${d}(${dayInfo?.day || ''}): ${done}完了 / ${failed}未達 / ${total}件中`);
          const c = comments[`day_${d}`];
          if (c) lines.push(`  コメント: ${c}`);
        });
        data = lines.join('\n');
        const wc = comments['weekly'];
        if (wc) data += `\n\n週間コメント: ${wc}`;
      }

      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      });
      const result = await res.json();
      if (result.success) {
        setReviews(prev => ({ ...prev, [key]: result.review }));
        saveReview(key, result.review);
      }
    } catch (e) {
      console.error('AI review error:', e);
    } finally {
      setReviewLoading(null);
    }
  };

  const handleReorder = (date: string, type: 'today' | 'daily', reordered: Task[]) => {
    const newTasks = { ...weekTasks };
    if (type === 'today') {
      newTasks[date] = { ...newTasks[date], today: reordered };
    } else {
      newTasks[date] = { ...newTasks[date], daily: reordered };
    }
    setWeekTasks({ ...newTasks });
    saveTasks(`${date}_${type}`, reordered);
  };

  const handleVoiceTasksConfirmed = async (date: string, parsed: ParsedTask[]) => {
    // API が既に Supabase に保存済み → クラウドから最新データを取得して反映
    const cloudToday = await loadTasksCloud(`${date}_today`);
    if (cloudToday) {
      const newTasks = { ...weekTasks };
      newTasks[date] = { ...newTasks[date], today: cloudToday };
      setWeekTasks({ ...newTasks });
      localSaveTasks(`${date}_today`, cloudToday);
      updateProgress(newTasks);
    } else {
      // フォールバック: クラウドから取得できなかった場合はローカルで追加
      const newTasks = { ...weekTasks };
      const todayList = [...newTasks[date].today];
      const maxId = todayList.length > 0 ? Math.max(...todayList.map(t => t.id)) : 0;
      parsed.forEach((p, i) => {
        todayList.push({
          id: maxId + 1 + i,
          text: p.text,
          completed: false,
          category: p.category,
        });
      });
      newTasks[date] = { ...newTasks[date], today: todayList };
      setWeekTasks({ ...newTasks });
      saveTasks(`${date}_today`, todayList);
      updateProgress(newTasks);
    }
  };

  const handleRating = (date: string, category: string, value: number) => {
    const current = dayRatings[date] || {};
    const updated = { ...current, [category]: current[category] === value ? 0 : value };
    setDayRatings(prev => ({ ...prev, [date]: updated }));
    saveRatings(date, updated);
  };

  const renderTaskList = (tasks: Task[], date: string, type: 'today' | 'daily') => (
    <SortableTaskList
      tasks={tasks} date={date} type={type}
      editingTask={editingTask} editText={editText} setEditText={setEditText}
      editCategory={editCategory} setEditCategory={setEditCategory}
      editMemo={editMemo} setEditMemo={setEditMemo}
      submitEdit={submitEdit} cancelEdit={() => { setEditingTask(null); setEditMemo(''); }}
      startEdit={startEdit} deleteTask={deleteTask} setTaskStatus={setTaskStatus}
      onMemoChange={updateTaskMemo}
      onReorder={handleReorder} styles={styles}
    />
  );

  const renderAddForm = (date: string, type: 'today' | 'daily') => {
    const isAdding = addingTo?.date === date && addingTo?.type === type;
    if (!isAdding) {
      return (
        <button onClick={() => startAdd(date, type)} className={styles.addTaskBtn}>
          + タスクを追加
        </button>
      );
    }
    return (
      <div className={styles.addTaskForm}>
        <input
          type="text"
          value={addText}
          onChange={(e) => setAddText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitAdd(); if (e.key === 'Escape') setAddingTo(null); }}
          placeholder="タスク名を入力..."
          className={styles.taskEditInput}
          autoFocus
        />
        <textarea
          value={addMemo}
          onChange={(e) => setAddMemo(e.target.value)}
          placeholder="メモ（任意）"
          className={styles.addMemoInput}
          rows={2}
        />
        <select value={addCategory} onChange={(e) => setAddCategory(e.target.value as any)} className={styles.addCategorySelect}>
          {CATEGORY_ORDER.map(cat => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat].icon} {CATEGORY_LABELS[cat].label}</option>
          ))}
        </select>
        <button onClick={submitAdd} className={styles.taskEditSave}>追加</button>
        <button onClick={() => setAddingTo(null)} className={styles.taskEditCancel}>&#10005;</button>
      </div>
    );
  };

  const renderTimeTracker = (date: string, type: 'wakeup' | 'sleep', target: string, label: string) => {
    const actual = timeRecords[`${date}_${type}`] || '';
    const diff = calcTimeDiff(target, actual);
    const isLate = diff.startsWith('+');
    const isEarly = diff.startsWith('-');

    return (
      <div className={styles.timeTracker}>
        <div className={styles.timeTrackerLabel}>{label}</div>
        <div className={styles.timeTrackerRow}>
          <div className={styles.timeTarget}>
            <span className={styles.timeTargetLabel}>TARGET</span>
            <span className={styles.timeTargetValue}>{target}</span>
          </div>
          <div className={styles.timeActual}>
            <span className={styles.timeActualLabel}>ACTUAL</span>
            <input
              type="time"
              value={actual}
              onChange={(e) => handleTimeChange(date, type, e.target.value)}
              className={styles.timeInput}
            />
          </div>
          {actual && (
            <div className={`${styles.timeDiff} ${isLate ? styles.timeDiffLate : ''} ${isEarly ? styles.timeDiffEarly : ''} ${diff === 'on time' ? styles.timeDiffOnTime : ''}`}>
              {diff}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDayCard = (date: string, compact: boolean = false) => {
    const dayData = WEEK_DATA[date];
    const tasks = weekTasks[date];
    if (!tasks) return null;
    const dayProgress = getDayProgress(date);
    const allTasks = [...tasks.today, ...tasks.daily];
    const resolvedCount = allTasks.filter(t => { const s = t.status || (t.completed ? 'done' : 'pending'); return s === 'done' || s === 'failed'; }).length;

    return (
      <div
        key={date}
        className={`${styles.dayCard} ${compact ? styles.dayCardCompact : ''}`}
        onClick={compact ? () => { setSelectedDate(date); setViewMode('day'); } : undefined}
      >
        <div className={styles.dayHeader}>
          <div className={styles.dayInfo}>
            <div className={styles.dateDisplay}>
              <span className={styles.date}>{date}</span>
              <span className={styles.dayOfWeek}>({dayData.day})</span>
            </div>
            <h3 className={styles.focusTitle}>{dayData.focus}</h3>
            {!compact && <p className={styles.inspiration}>{dayData.inspiration}</p>}
          </div>
          <div className={styles.dayStats}>
            <span className={styles.completedCount}>{resolvedCount}/{allTasks.length}</span>
          </div>
        </div>

        <div className={styles.dayProgressSection}>
          <div className={styles.dayProgressBar}>
            <div className={styles.dayProgressFill} style={{ width: `${dayProgress}%` }}></div>
          </div>
        </div>

        {!compact && (
          <>
            {/* Time Trackers */}
            <div className={styles.timeTrackers}>
              {renderTimeTracker(date, 'wakeup', '08:00', '起床')}
              {renderTimeTracker(date, 'sleep', '01:00', '就寝')}
            </div>

            {/* Goals */}
            <div className={styles.goalSection}>
              <div className={styles.goalHeader}>
                <span className={styles.goalLabel}>GOALS</span>
              </div>
              <div className={styles.goalList}>
                {dayData.goals.map((g, i) => (
                  <span key={i} className={styles.goalTag}>{g}</span>
                ))}
              </div>
            </div>

            {/* Milestone */}
            <div className={styles.milestoneSection}>
              <span className={styles.milestoneTitle}>{dayData.milestoneTitle}</span>
              <p className={styles.milestoneDescription}>{dayData.milestoneDescription}</p>
            </div>

            {/* Voice Input */}
            <VoiceInput
              date={date}
              onTasksConfirmed={(parsed) => handleVoiceTasksConfirmed(date, parsed)}
            />

            {/* TODAY tasks */}
            <div className={styles.taskSection}>
              <div className={styles.taskSectionHeader}>
                <h4 className={styles.taskSectionTitle}>
                  <span className={styles.taskSectionBadge}>TODAY</span>
                  <span className={styles.taskSectionSub}>{date}のタスク</span>
                </h4>
                {getPrevDate(date) && (
                  <button
                    className={styles.carryOverBtn}
                    onClick={() => carryOverFromPrevDay(date)}
                  >
                    &#8592; 前日の未完了を読込
                  </button>
                )}
              </div>
              {renderTaskList(tasks.today, date, 'today')}
              {renderAddForm(date, 'today')}
            </div>

            {/* DAILY ROUTINE tasks */}
            <div className={styles.taskSection}>
              <h4 className={styles.taskSectionTitle}>
                <span className={styles.taskSectionBadgeDaily}>DAILY</span>
                <span className={styles.taskSectionSub}>毎日のルーティン</span>
              </h4>
              {renderTaskList(tasks.daily, date, 'daily')}
              {renderAddForm(date, 'daily')}
            </div>

            {/* Daily Rating */}
            <div className={styles.ratingSection}>
              <h4 className={styles.taskSectionTitle}>
                <span className={styles.ratingBadge}>REVIEW</span>
                <span className={styles.taskSectionSub}>今日の評価</span>
              </h4>
              <div className={styles.ratingGrid}>
                {RATING_CATEGORIES.map(cat => {
                  const currentValue = dayRatings[date]?.[cat.key] || 0;
                  return (
                    <div key={cat.key} className={styles.ratingRow}>
                      <span className={styles.ratingLabel}>{cat.label}</span>
                      {cat.type === 'boolean' ? (
                        <div className={styles.ratingBoolBtns}>
                          <button
                            onClick={() => handleRating(date, cat.key, currentValue === 1 ? 0 : 1)}
                            className={`${styles.ratingBoolBtn} ${styles.ratingBoolYes} ${currentValue === 1 ? styles.ratingBoolActive : ''}`}
                          >&#9675;</button>
                          <button
                            onClick={() => handleRating(date, cat.key, currentValue === 2 ? 0 : 2)}
                            className={`${styles.ratingBoolBtn} ${styles.ratingBoolMid} ${currentValue === 2 ? styles.ratingBoolActive : ''}`}
                          >&#9651;</button>
                          <button
                            onClick={() => handleRating(date, cat.key, currentValue === -1 ? 0 : -1)}
                            className={`${styles.ratingBoolBtn} ${styles.ratingBoolNo} ${currentValue === -1 ? styles.ratingBoolActive : ''}`}
                          >&#10005;</button>
                        </div>
                      ) : (
                        <div className={styles.ratingStars}>
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              onClick={() => handleRating(date, cat.key, v)}
                              className={`${styles.ratingStar} ${v <= currentValue ? styles.ratingStarActive : ''} ${cat.key === 'overall' ? styles.ratingStarOverall : ''}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Comment */}
            <div className={styles.diarySection}>
              <h4 className={styles.taskSectionTitle}>
                <span className={styles.diaryBadge}>DIARY</span>
                <span className={styles.taskSectionSub}>今日のコメント</span>
              </h4>
              <textarea
                className={styles.diaryTextarea}
                value={comments[`day_${date}`] || ''}
                onChange={(e) => handleCommentChange(`day_${date}`, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
                placeholder="今日の出来事、感じたこと、反省点など... (Cmd+Enterで確定)"
                rows={3}
              />
            </div>

            {/* AI Daily Review */}
            <div className={styles.reviewSection}>
              <div className={styles.reviewHeader}>
                <h4 className={styles.taskSectionTitle}>
                  <span className={styles.reviewBadge}>AI REVIEW</span>
                  <span className={styles.taskSectionSub}>今日の振り返り</span>
                </h4>
                <button
                  className={styles.reviewBtn}
                  onClick={() => requestAIReview(`day_${date}`, 'daily')}
                  disabled={reviewLoading === `day_${date}`}
                >
                  {reviewLoading === `day_${date}` ? '生成中...' : 'AI レビューを生成'}
                </button>
              </div>
              {reviewLoading === `day_${date}` && (
                <div className={styles.reviewLoading}>
                  <div className={styles.reviewLoadingBar} />
                  <p className={styles.reviewLoadingText}>AIがタスクデータを分析しています...</p>
                </div>
              )}
              {!reviewLoading && reviews[`day_${date}`] && (
                <div className={styles.reviewContent}>
                  {reviews[`day_${date}`]}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <main className={styles.main}>
      {celebrations.map(c => (
        <div key={c.id} className={styles.celebration} style={{ left: `${c.x}px`, top: `${c.y}px` }}>&#10024;</div>
      ))}

      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerTop}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.title}>Sesuji Week</h1>
              <div className={styles.progressInline}>
                <div className={styles.progressBarInline}>
                  <div className={styles.progressBarInlineFill} style={{ width: `${totalProgress}%` }}></div>
                </div>
                <span className={styles.progressValueInline}>{totalProgress}%</span>
              </div>
            </div>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewBtn} ${viewMode === 'day' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('day')}>Day</button>
              <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('list')}>List</button>
            </div>
          </div>
          {viewMode === 'day' && (() => {
            const { year, month } = calendarMonth;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthLabel = `${month + 1}月`;
            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

            return (
              <div className={styles.dateStrip}>
                <button className={styles.dateStripNav} onClick={() => setCalendarMonth(p => {
                  const d = new Date(p.year, p.month - 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })}>&#8249;</button>
                <span className={styles.dateStripMonth}>{monthLabel}</span>
                <div className={styles.dateStripScroll}>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateKey = `${month + 1}/${day}`;
                    const dow = new Date(year, month, day).getDay();
                    const hasData = !!WEEK_DATA[dateKey];
                    const isSelected = selectedDate === dateKey;
                    const isToday = (() => { const n = new Date(); return n.getFullYear() === year && n.getMonth() === month && n.getDate() === day; })();
                    const prog = hasData ? getDayProgress(dateKey) : 0;
                    return (
                      <button
                        key={dateKey}
                        className={`${styles.dateStripDay} ${isSelected ? styles.dateStripDaySelected : ''} ${isToday ? styles.dateStripDayToday : ''} ${hasData ? styles.dateStripDayHasData : ''}`}
                        onClick={() => { if (hasData) setSelectedDate(dateKey); }}
                        disabled={!hasData}
                      >
                        <span className={styles.dateStripDow}>{dayNames[dow]}</span>
                        <span className={styles.dateStripNum}>{day}</span>
                        {hasData && prog > 0 && <div className={styles.dateStripDot} />}
                      </button>
                    );
                  })}
                </div>
                <button className={styles.dateStripNav} onClick={() => setCalendarMonth(p => {
                  const d = new Date(p.year, p.month + 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })}>&#8250;</button>
              </div>
            );
          })()}
        </div>
      </header>

      {viewMode === 'day' && (
        <section className={styles.dayViewSection}>
          <div className={styles.container}>
            {renderDayCard(selectedDate)}

            {/* Weekly Section (shown on Sunday) */}
            {WEEK_DATA[selectedDate]?.day === '日' && (
              <div className={styles.weeklySection}>
                <div className={styles.diarySection}>
                  <h4 className={styles.taskSectionTitle}>
                    <span className={styles.weeklyBadge}>WEEKLY DIARY</span>
                    <span className={styles.taskSectionSub}>今週のコメント</span>
                  </h4>
                  <textarea
                    className={styles.diaryTextarea}
                    value={comments['weekly'] || ''}
                    onChange={(e) => handleCommentChange('weekly', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
                    placeholder="今週全体の振り返り、来週への意気込み... (Cmd+Enterで確定)"
                    rows={4}
                  />
                </div>
                <div className={styles.reviewSection}>
                  <div className={styles.reviewHeader}>
                    <h4 className={styles.taskSectionTitle}>
                      <span className={styles.reviewBadge}>AI WEEKLY REVIEW</span>
                      <span className={styles.taskSectionSub}>今週の振り返り</span>
                    </h4>
                    <button
                      className={styles.reviewBtn}
                      onClick={() => requestAIReview('weekly', 'weekly')}
                      disabled={reviewLoading === 'weekly'}
                    >
                      {reviewLoading === 'weekly' ? '生成中...' : 'AI 週間レビューを生成'}
                    </button>
                  </div>
                  {reviewLoading === 'weekly' && (
                    <div className={styles.reviewLoading}>
                      <div className={styles.reviewLoadingBar} />
                      <p className={styles.reviewLoadingText}>AIが1週間のデータを分析しています...</p>
                    </div>
                  )}
                  {reviewLoading !== 'weekly' && reviews['weekly'] && (
                    <div className={styles.reviewContent}>
                      {reviews['weekly']}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {viewMode === 'list' && (() => {
        const todayDate = '3/31';
        const todayIdx = dates.indexOf(todayDate);
        const sortedDates = todayIdx >= 0
          ? [...dates.slice(todayIdx), ...dates.slice(0, todayIdx)]
          : dates;

        return (
          <section className={styles.weekListSection}>
            <div className={styles.container}>
              {sortedDates.map(date => {
                const dayData = WEEK_DATA[date];
                const tasks = weekTasks[date];
                if (!tasks) return null;
                const allTasks = [...tasks.today, ...tasks.daily];
                const doneCount = allTasks.filter(t => (t.status || (t.completed ? 'done' : 'pending')) === 'done').length;
                const failedCount = allTasks.filter(t => t.status === 'failed').length;
                const dayProgress = getDayProgress(date);
                const isToday = date === todayDate;

                const groupedToday: { [cat: string]: Task[] } = {};
                tasks.today.forEach(t => {
                  const cat = t.category || 'morning';
                  if (!groupedToday[cat]) groupedToday[cat] = [];
                  groupedToday[cat].push(t);
                });

                return (
                  <div key={date} className={`${styles.weekListDay} ${isToday ? styles.weekListDayToday : ''}`}>
                    <div className={styles.weekListDayHeader} onClick={() => { setSelectedDate(date); setViewMode('day'); }}>
                      <div className={styles.weekListDayInfo}>
                        {isToday && <span className={styles.weekListTodayBadge}>TODAY</span>}
                        <span className={styles.weekListDate}>{date}</span>
                        <span className={styles.weekListDayOfWeek}>({dayData.day})</span>
                        <span className={styles.weekListFocus}>{dayData.focus}</span>
                      </div>
                      <div className={styles.weekListStats}>
                        <span className={styles.weekListCount}>{doneCount}{failedCount > 0 && <span className={styles.weekListFailCount}>/{failedCount}&#10005;</span>}/{allTasks.length}</span>
                      </div>
                    </div>
                    <div className={styles.weekListProgress}>
                      <div className={styles.weekListProgressFill} style={{ width: `${dayProgress}%` }}></div>
                    </div>
                    {(() => {
                      const wakeup = timeRecords[`${date}_wakeup`];
                      const sleep = timeRecords[`${date}_sleep`];
                      if (!wakeup && !sleep) return null;
                      return (
                        <div className={styles.weekListTimes}>
                          {wakeup && <span className={styles.weekListTime}>起床 {wakeup}</span>}
                          {sleep && <span className={styles.weekListTime}>就寝 {sleep}</span>}
                        </div>
                      );
                    })()}
                    <div className={styles.weekListTasks}>
                      {CATEGORY_ORDER.map(cat => {
                        const catTasks = (groupedToday[cat] || []);
                        if (catTasks.length === 0) return null;
                        return (
                          <div key={cat} className={styles.weekListCategory}>
                            <span className={styles.weekListCategoryIcon}>{CATEGORY_LABELS[cat].icon}</span>
                            <div className={styles.weekListCategoryTasks}>
                              {catTasks.map(t => {
                                const ts = t.status || (t.completed ? 'done' : 'pending');
                                return (
                                  <span key={t.id} className={`${styles.weekListTask} ${ts === 'done' ? styles.weekListTaskDone : ''} ${ts === 'failed' ? styles.weekListTaskFailed : ''}`}>
                                    {ts === 'done' && <span className={styles.weekListStatusIcon}>&#10003;</span>}
                                    {ts === 'failed' && <span className={styles.weekListStatusIcon}>&#10005;</span>}
                                    {t.text}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p className={styles.footerText}>Discipline is the bridge between goals and accomplishment.</p>
        </div>
      </footer>
    </main>
  );
}
