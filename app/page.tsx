'use client';

import { useState, useEffect } from 'react';
import { Task, DayPlan } from '@/lib/types';
import { saveTasks, loadTasks } from '@/lib/storage';
import { inspirations } from '@/lib/inspirations';
import styles from './page.module.css';

// 毎日のルーティンタスク（全日共通）
const DAILY_TASKS: Task[] = [
  { id: 100, text: '8:00 起床', completed: false, category: 'daily' },
  { id: 101, text: 'スキンケア（朝：洗顔・ビュッフェ・日焼け止め）', completed: false, category: 'daily' },
  { id: 102, text: 'サプリメント摂取（朝）', completed: false, category: 'daily' },
  { id: 103, text: 'トレーニング / ストレッチ', completed: false, category: 'daily' },
  { id: 104, text: 'サプリメント摂取（夜：プロテイン・グルタミン）', completed: false, category: 'daily' },
  { id: 105, text: 'スキンケア（夜：AHA洗顔・レチノイド）', completed: false, category: 'daily' },
  { id: 106, text: '禁欲', completed: false, category: 'daily' },
  { id: 107, text: '深夜スマホ禁止', completed: false, category: 'daily' },
  { id: 108, text: '23:00 全タスク完了（23時以降のみ喫煙可）', completed: false, category: 'daily' },
  { id: 109, text: '1:00 就寝', completed: false, category: 'daily' },
];

const WEEK_DATA: { [key: string]: DayPlan } = {
  '3/31': {
    date: '3/31',
    day: '月',
    focus: 'システム・リセット',
    inspiration: inspirations['3/31'].description,
    todayTasks: [
      { id: 1, text: '申告書の再提出', completed: false, category: 'today' },
      { id: 2, text: '個人事業税の支払い', completed: false, category: 'today' },
      { id: 3, text: 'YORKYSブランチのメニュー部分構築', completed: false, category: 'today' },
      { id: 4, text: '筋トレ', completed: false, category: 'today' },
      { id: 5, text: '日焼け', completed: false, category: 'today' },
    ],
    dailyTasks: [],
    goal: '禁欲',
    milestoneTitle: inspirations['3/31'].milestone,
    milestoneDescription: inspirations['3/31'].story,
  },
  '4/1': {
    date: '4/1',
    day: '火',
    focus: 'Training Day 1',
    inspiration: inspirations['4/1'].description,
    todayTasks: [
      { id: 1, text: 'サプリ・機材の発注', completed: false, category: 'today' },
      { id: 2, text: '筋トレ：背面（デッドリフト）', completed: false, category: 'today' },
      { id: 3, text: 'レチノイド開始', completed: false, category: 'today' },
    ],
    dailyTasks: [],
    goal: '禁欲',
    milestoneTitle: inspirations['4/1'].milestone,
    milestoneDescription: inspirations['4/1'].story,
  },
  '4/2': {
    date: '4/2',
    day: '水',
    focus: 'Deep Work',
    inspiration: inspirations['4/2'].description,
    todayTasks: [
      { id: 1, text: '09:00-12:00 重要タスク3時間', completed: false, category: 'today' },
      { id: 2, text: 'セックス判定（Option A）', completed: false, category: 'today' },
      { id: 3, text: 'レチノイド塗布', completed: false, category: 'today' },
    ],
    dailyTasks: [],
    goal: 'Option A',
    milestoneTitle: inspirations['4/2'].milestone,
    milestoneDescription: inspirations['4/2'].story,
  },
  '4/3': {
    date: '4/3',
    day: '木',
    focus: 'Recovery',
    inspiration: inspirations['4/3'].description,
    todayTasks: [
      { id: 1, text: 'ミヤリサン（腸内デバッグ）', completed: false, category: 'today' },
      { id: 2, text: '仕事の詰まり解消', completed: false, category: 'today' },
    ],
    dailyTasks: [],
    goal: '禁欲',
    milestoneTitle: inspirations['4/3'].milestone,
    milestoneDescription: inspirations['4/3'].story,
  },
  '4/4': {
    date: '4/4',
    day: '金',
    focus: 'Training Day 2',
    inspiration: inspirations['4/4'].description,
    todayTasks: [
      { id: 1, text: '筋トレ：全身/背面', completed: false, category: 'today' },
      { id: 2, text: '16kgダンベルの質を追求', completed: false, category: 'today' },
      { id: 3, text: 'セックス可能（Option B）', completed: false, category: 'today' },
    ],
    dailyTasks: [],
    goal: 'Option B',
    milestoneTitle: inspirations['4/4'].milestone,
    milestoneDescription: inspirations['4/4'].story,
  },
  '4/5': {
    date: '4/5',
    day: '土',
    focus: 'Maintenance',
    inspiration: inspirations['4/5'].description,
    todayTasks: [
      { id: 1, text: '銭湯 + Ma:nyo オイルデトックス', completed: false, category: 'today' },
      { id: 2, text: '精悍さを固定', completed: false, category: 'today' },
      { id: 3, text: 'サイリウム + 水分2L', completed: false, category: 'today' },
    ],
    dailyTasks: [],
    goal: 'Option B',
    milestoneTitle: inspirations['4/5'].milestone,
    milestoneDescription: inspirations['4/5'].story,
  },
  '4/6': {
    date: '4/6',
    day: '日',
    focus: 'Review',
    inspiration: inspirations['4/6'].description,
    todayTasks: [
      { id: 1, text: '腹の締まりを確認', completed: false, category: 'today' },
      { id: 2, text: 'おでこのポツポツをチェック', completed: false, category: 'today' },
      { id: 3, text: '仕事の進捗を査定', completed: false, category: 'today' },
      { id: 4, text: '次週へのOSアップデート', completed: false, category: 'today' },
    ],
    dailyTasks: [],
    goal: '禁欲',
    milestoneTitle: inspirations['4/6'].milestone,
    milestoneDescription: inspirations['4/6'].story,
  },
};

type ViewMode = 'day' | 'week';

interface Celebration {
  id: string;
  x: number;
  y: number;
}

export default function Home() {
  const [weekTasks, setWeekTasks] = useState<{ [key: string]: { today: Task[]; daily: Task[] } }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState('3/31');

  useEffect(() => {
    const loaded: { [key: string]: { today: Task[]; daily: Task[] } } = {};
    Object.keys(WEEK_DATA).forEach(date => {
      const savedToday = loadTasks(`${date}_today`);
      const savedDaily = loadTasks(`${date}_daily`);
      loaded[date] = {
        today: savedToday || WEEK_DATA[date].todayTasks,
        daily: savedDaily || DAILY_TASKS.map(t => ({ ...t })),
      };
    });
    setWeekTasks(loaded);
    setIsLoaded(true);
    updateProgress(loaded);
  }, []);

  const updateProgress = (tasks: { [key: string]: { today: Task[]; daily: Task[] } }) => {
    let total = 0;
    let completed = 0;
    Object.keys(tasks).forEach(date => {
      [...tasks[date].today, ...tasks[date].daily].forEach(task => {
        total++;
        if (task.completed) completed++;
      });
    });
    setTotalProgress(total === 0 ? 0 : Math.round((completed / total) * 100));
  };

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
    const x = e.clientX;
    const y = e.clientY;
    setCelebrations(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setCelebrations(prev => prev.filter(c => c.id !== id));
    }, 1000);
  };

  const getDayProgress = (date: string) => {
    const t = weekTasks[date];
    if (!t) return 0;
    const all = [...t.today, ...t.daily];
    if (all.length === 0) return 0;
    const completed = all.filter(t => t.completed).length;
    return Math.round((completed / all.length) * 100);
  };

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>背筋ウィークを読み込み中...</p>
      </div>
    );
  }

  const dates = Object.keys(WEEK_DATA);

  const renderDayCard = (date: string, compact: boolean = false) => {
    const dayData = WEEK_DATA[date];
    const tasks = weekTasks[date];
    if (!tasks) return null;
    const dayProgress = getDayProgress(date);
    const allTasks = [...tasks.today, ...tasks.daily];
    const completedCount = allTasks.filter(t => t.completed).length;

    return (
      <div
        key={date}
        className={`${styles.dayCard} ${compact ? styles.dayCardCompact : ''} ${selectedDate === date && viewMode === 'week' ? styles.dayCardActive : ''}`}
        onClick={compact ? () => { setSelectedDate(date); setViewMode('day'); } : undefined}
      >
        {/* Day Header */}
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

        {/* Progress */}
        <div className={styles.dayProgressSection}>
          <div className={styles.dayProgressBar}>
            <div className={styles.dayProgressFill} style={{ width: `${dayProgress}%` }}></div>
          </div>
        </div>

        {!compact && (
          <>
            {/* Goal */}
            <div className={styles.goalSection}>
              <span className={styles.goalLabel}>GOAL</span>
              <span className={styles.goalValue}>{dayData.goal}</span>
            </div>

            {/* Milestone */}
            <div className={styles.milestoneSection}>
              <span className={styles.milestoneTitle}>{dayData.milestoneTitle}</span>
              <p className={styles.milestoneDescription}>{dayData.milestoneDescription}</p>
            </div>

            {/* Today's Tasks */}
            <div className={styles.taskSection}>
              <h4 className={styles.taskSectionTitle}>
                <span className={styles.taskSectionIcon}>&#9889;</span>
                TODAY
              </h4>
              <div className={styles.tasksList}>
                {tasks.today.map(task => (
                  <label key={task.id} className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : ''}`}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => toggleTask(date, task.id, 'today', e)}
                      className={styles.taskCheckbox}
                    />
                    <span className={styles.taskText}>{task.text}</span>
                    {task.completed && <span className={styles.taskCheck}>&#10003;</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Daily Routine Tasks */}
            <div className={styles.taskSection}>
              <h4 className={styles.taskSectionTitle}>
                <span className={styles.taskSectionIcon}>&#8634;</span>
                DAILY ROUTINE
              </h4>
              <div className={styles.tasksList}>
                {tasks.daily.map(task => (
                  <label key={task.id} className={`${styles.taskItem} ${styles.taskItemDaily} ${task.completed ? styles.taskCompleted : ''}`}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => toggleTask(date, task.id, 'daily', e)}
                      className={styles.taskCheckbox}
                    />
                    <span className={styles.taskText}>{task.text}</span>
                    {task.completed && <span className={styles.taskCheck}>&#10003;</span>}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <main className={styles.main}>
      {/* Celebration Particles */}
      {celebrations.map(celebration => (
        <div
          key={celebration.id}
          className={styles.celebration}
          style={{ left: `${celebration.x}px`, top: `${celebration.y}px` }}
        >
          &#10024;
        </div>
      ))}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>Sesuji Week</h1>
              <p className={styles.subtitle}>7-day life refactoring system</p>
            </div>
            {/* View Toggle */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${viewMode === 'day' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('day')}
              >
                Day
              </button>
              <button
                className={`${styles.viewBtn} ${viewMode === 'week' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('week')}
              >
                Week
              </button>
            </div>
          </div>

          {/* Overall Progress */}
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

      {/* Day View */}
      {viewMode === 'day' && (
        <section className={styles.dayViewSection}>
          <div className={styles.container}>
            {/* Day Selector */}
            <div className={styles.daySelector}>
              {dates.map(date => {
                const prog = getDayProgress(date);
                return (
                  <button
                    key={date}
                    className={`${styles.daySelectorBtn} ${selectedDate === date ? styles.daySelectorBtnActive : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <span className={styles.daySelectorDay}>{WEEK_DATA[date].day}</span>
                    <span className={styles.daySelectorDate}>{date}</span>
                    <div className={styles.daySelectorProgress}>
                      <div className={styles.daySelectorProgressFill} style={{ width: `${prog}%` }}></div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day */}
            {renderDayCard(selectedDate)}
          </div>
        </section>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <section className={styles.weekViewSection}>
          <div className={styles.container}>
            <div className={styles.weekGrid}>
              {dates.map(date => renderDayCard(date, true))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p className={styles.footerText}>
            Discipline is the bridge between goals and accomplishment.
          </p>
        </div>
      </footer>
    </main>
  );
}
