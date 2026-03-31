'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, DayPlan } from '@/lib/types';
import { saveTasks, loadTasks, mergeTasks, saveTimeRecord, loadTimeRecord } from '@/lib/storage';
import { inspirations } from '@/lib/inspirations';
import styles from './page.module.css';

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
  const hasBodySkincare = ['4/2', '4/3', '4/4', '4/5', '4/6'].includes(date);

  const tasks: Task[] = [
    // Morning
    { id: 201, text: 'サプリメント摂取（朝）', completed: false, category: 'morning' },
    { id: 202, text: '日焼けをする', completed: false, category: 'morning' },
    // Work
    { id: 301, text: '仕事中プライベート禁止（SNS・動画など）', completed: false, category: 'work' },
    // Evening
    { id: 401, text: 'トレーニング / ストレッチ', completed: false, category: 'evening' },
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
      { id: 4, text: '筋トレ', completed: false, category: 'evening' },
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
};

const CATEGORY_LABELS: { [key: string]: { label: string; icon: string } } = {
  morning: { label: 'MORNING', icon: '☀' },
  work: { label: 'WORK', icon: '💻' },
  evening: { label: 'EVENING', icon: '🏋' },
  night: { label: 'NIGHT', icon: '🌙' },
};

const CATEGORY_ORDER = ['morning', 'work', 'evening', 'night'];

type ViewMode = 'day' | 'week';

interface Celebration {
  id: string;
  x: number;
  y: number;
}

function groupByCategory(tasks: Task[]) {
  const groups: { [cat: string]: Task[] } = {};
  for (const task of tasks) {
    const cat = task.category || 'morning';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(task);
  }
  return groups;
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
  const [selectedDate, setSelectedDate] = useState('3/31');
  const [timeRecords, setTimeRecords] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loaded: { [key: string]: { today: Task[]; daily: Task[] } } = {};
    const times: { [key: string]: string } = {};
    Object.keys(WEEK_DATA).forEach(date => {
      const savedToday = loadTasks(`${date}_today`);
      const savedDaily = loadTasks(`${date}_daily`);
      loaded[date] = {
        today: mergeTasks(WEEK_DATA[date].todayTasks, savedToday),
        daily: mergeTasks(makeDailyTasks(date), savedDaily),
      };
      const wakeup = loadTimeRecord(date, 'wakeup');
      const sleep = loadTimeRecord(date, 'sleep');
      if (wakeup) times[`${date}_wakeup`] = wakeup;
      if (sleep) times[`${date}_sleep`] = sleep;
    });
    setWeekTasks(loaded);
    setTimeRecords(times);
    setIsLoaded(true);
    updateProgress(loaded);
  }, []);

  const updateProgress = useCallback((tasks: { [key: string]: { today: Task[]; daily: Task[] } }) => {
    let total = 0;
    let completed = 0;
    Object.keys(tasks).forEach(date => {
      [...tasks[date].today, ...tasks[date].daily].forEach(task => {
        total++;
        if (task.completed) completed++;
      });
    });
    setTotalProgress(total === 0 ? 0 : Math.round((completed / total) * 100));
  }, []);

  const toggleTask = (date: string, taskId: number, type: 'today' | 'daily', e?: React.MouseEvent | React.ChangeEvent) => {
    const newTasks = { ...weekTasks };
    const taskList = type === 'today' ? newTasks[date].today : newTasks[date].daily;
    const task = taskList.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      setWeekTasks({ ...newTasks });
      saveTasks(`${date}_${type}`, taskList);
      updateProgress(newTasks);
      if (task.completed && e && 'clientX' in e) {
        createCelebration(e as React.MouseEvent);
      }
    }
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
    return Math.round((all.filter(t => t.completed).length / all.length) * 100);
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

  const renderTaskGroup = (tasks: Task[], date: string, type: 'today' | 'daily', cat: string) => (
    <div key={cat} className={styles.taskGroup}>
      <div className={styles.taskGroupHeader}>
        <span className={styles.taskGroupIcon}>{CATEGORY_LABELS[cat]?.icon}</span>
        <span className={styles.taskGroupLabel}>{CATEGORY_LABELS[cat]?.label}</span>
      </div>
      {tasks.map(task => (
        <label key={`${type}_${task.id}`} className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : ''} ${type === 'daily' ? styles.taskItemDaily : ''}`}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => toggleTask(date, task.id, type, e)}
            className={styles.taskCheckbox}
          />
          <span className={styles.taskText}>{task.text}</span>
          {task.completed && <span className={styles.taskCheck}>&#10003;</span>}
        </label>
      ))}
    </div>
  );

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
    const completedCount = allTasks.filter(t => t.completed).length;

    const todayGroups = groupByCategory(tasks.today);
    const dailyGroups = groupByCategory(tasks.daily);

    return (
      <div
        key={date}
        className={`${styles.dayCard} ${compact ? styles.dayCardCompact : ''} ${selectedDate === date && viewMode === 'week' ? styles.dayCardActive : ''}`}
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
            <span className={styles.completedCount}>{completedCount}/{allTasks.length}</span>
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

            {/* TODAY tasks */}
            <div className={styles.taskSection}>
              <h4 className={styles.taskSectionTitle}>
                <span className={styles.taskSectionBadge}>TODAY</span>
                <span className={styles.taskSectionSub}>{date}のタスク</span>
              </h4>
              {CATEGORY_ORDER.map(cat =>
                todayGroups[cat] && todayGroups[cat].length > 0
                  ? renderTaskGroup(todayGroups[cat], date, 'today', cat)
                  : null
              )}
            </div>

            {/* DAILY ROUTINE tasks */}
            <div className={styles.taskSection}>
              <h4 className={styles.taskSectionTitle}>
                <span className={styles.taskSectionBadgeDaily}>DAILY</span>
                <span className={styles.taskSectionSub}>毎日のルーティン</span>
              </h4>
              {CATEGORY_ORDER.map(cat =>
                dailyGroups[cat] && dailyGroups[cat].length > 0
                  ? renderTaskGroup(dailyGroups[cat], date, 'daily', cat)
                  : null
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
            <div>
              <h1 className={styles.title}>Sesuji Week</h1>
              <p className={styles.subtitle}>7-day life refactoring system</p>
            </div>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewBtn} ${viewMode === 'day' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('day')}>Day</button>
              <button className={`${styles.viewBtn} ${viewMode === 'week' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('week')}>Week</button>
            </div>
          </div>
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>WEEKLY PROGRESS</span>
              <span className={styles.progressValue}>{totalProgress}%</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar} style={{ width: `${totalProgress}%` }}></div>
            </div>
          </div>
        </div>
      </header>

      {viewMode === 'day' && (
        <section className={styles.dayViewSection}>
          <div className={styles.container}>
            <div className={styles.daySelector}>
              {dates.map(date => {
                const prog = getDayProgress(date);
                return (
                  <button key={date} className={`${styles.daySelectorBtn} ${selectedDate === date ? styles.daySelectorBtnActive : ''}`} onClick={() => setSelectedDate(date)}>
                    <span className={styles.daySelectorDay}>{WEEK_DATA[date].day}</span>
                    <span className={styles.daySelectorDate}>{date}</span>
                    <div className={styles.daySelectorProgress}>
                      <div className={styles.daySelectorProgressFill} style={{ width: `${prog}%` }}></div>
                    </div>
                  </button>
                );
              })}
            </div>
            {renderDayCard(selectedDate)}
          </div>
        </section>
      )}

      {viewMode === 'week' && (
        <section className={styles.weekViewSection}>
          <div className={styles.container}>
            <div className={styles.weekGrid}>
              {dates.map(date => renderDayCard(date, true))}
            </div>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p className={styles.footerText}>Discipline is the bridge between goals and accomplishment.</p>
        </div>
      </footer>
    </main>
  );
}
