'use client';

import { useState, useEffect } from 'react';
import { Task, DayPlan } from '@/lib/types';
import { saveTasks, loadTasks, getAllTasksProgress, getDayProgress } from '@/lib/storage';
import { inspirations } from '@/lib/inspirations';
import styles from './page.module.css';

const WEEK_DATA: { [key: string]: DayPlan } = {
  '3/31': {
    date: '3/31',
    day: '火',
    focus: 'システム・リセット',
    inspiration: inspirations['3/31'].description,
    tasks: [
      { id: 1, text: 'ケアセラ受取', completed: false },
      { id: 2, text: 'サプリ・機材の発注', completed: false },
      { id: 3, text: '仕事は定時で', completed: false },
      { id: 4, text: '24時に就寝', completed: false }
    ],
    sexStatus: '禁欲',
    milestoneTitle: inspirations['3/31'].milestone,
    milestoneDescription: inspirations['3/31'].story,
    color: 'turquoise'
  },
  '4/1': {
    date: '4/1',
    day: '水',
    focus: 'Training Day 1',
    inspiration: inspirations['4/1'].description,
    tasks: [
      { id: 1, text: '08:00 起床・洗顔', completed: false },
      { id: 2, text: 'ビュッフェ塗布', completed: false },
      { id: 3, text: '筋トレ：背面（デッドリフト）', completed: false },
      { id: 4, text: 'グルタミン・プロテイン', completed: false },
      { id: 5, text: 'レチノイド開始', completed: false }
    ],
    sexStatus: '禁欲',
    milestoneTitle: inspirations['4/1'].milestone,
    milestoneDescription: inspirations['4/1'].story,
    color: 'ocean'
  },
  '4/2': {
    date: '4/2',
    day: '木',
    focus: 'Deep Work',
    inspiration: inspirations['4/2'].description,
    tasks: [
      { id: 1, text: '08:00 起床・ルーティン', completed: false },
      { id: 2, text: '09:00-12:00 重要タスク3時間', completed: false },
      { id: 3, text: 'セックス判定（Option A）', completed: false },
      { id: 4, text: 'レチノイド塗布', completed: false }
    ],
    sexStatus: 'Option A',
    milestoneTitle: inspirations['4/2'].milestone,
    milestoneDescription: inspirations['4/2'].story,
    color: 'cyan'
  },
  '4/3': {
    date: '4/3',
    day: '金',
    focus: 'Recovery',
    inspiration: inspirations['4/3'].description,
    tasks: [
      { id: 1, text: 'ミヤリサン（腸内デバッグ）', completed: false },
      { id: 2, text: '仕事の詰まり解消', completed: false },
      { id: 3, text: 'スキンケア完遂', completed: false },
      { id: 4, text: '深夜スマホ禁止', completed: false }
    ],
    sexStatus: '禁欲',
    milestoneTitle: inspirations['4/3'].milestone,
    milestoneDescription: inspirations['4/3'].story,
    color: 'ocean'
  },
  '4/4': {
    date: '4/4',
    day: '土',
    focus: 'Training Day 2',
    inspiration: inspirations['4/4'].description,
    tasks: [
      { id: 1, text: '08:00 起床', completed: false },
      { id: 2, text: '筋トレ：全身/背面', completed: false },
      { id: 3, text: '16kgダンベルの質を追求', completed: false },
      { id: 4, text: 'セックス可能（Option B）', completed: false }
    ],
    sexStatus: 'Option B',
    milestoneTitle: inspirations['4/4'].milestone,
    milestoneDescription: inspirations['4/4'].story,
    color: 'turquoise'
  },
  '4/5': {
    date: '4/5',
    day: '日',
    focus: 'Maintenance',
    inspiration: inspirations['4/5'].description,
    tasks: [
      { id: 1, text: '銭湯 + Ma:nyo オイルデトックス', completed: false },
      { id: 2, text: '精悍さを固定', completed: false },
      { id: 3, text: 'セックス可能（Option B）', completed: false },
      { id: 4, text: 'サイリウム + 水分2L', completed: false }
    ],
    sexStatus: 'Option B',
    milestoneTitle: inspirations['4/5'].milestone,
    milestoneDescription: inspirations['4/5'].story,
    color: 'cyan'
  },
  '4/6': {
    date: '4/6',
    day: '月',
    focus: 'Review',
    inspiration: inspirations['4/6'].description,
    tasks: [
      { id: 1, text: '腹の締まりを確認', completed: false },
      { id: 2, text: 'おでこのポツポツをチェック', completed: false },
      { id: 3, text: '仕事の進捗を査定', completed: false },
      { id: 4, text: '次週へのOSアップデート', completed: false }
    ],
    sexStatus: '禁欲',
    milestoneTitle: inspirations['4/6'].milestone,
    milestoneDescription: inspirations['4/6'].story,
    color: 'turquoise'
  }
};

interface Celebration {
  id: string;
  x: number;
  y: number;
}

export default function Home() {
  const [weekTasks, setWeekTasks] = useState<{ [key: string]: Task[] }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const loadedTasks: { [key: string]: Task[] } = {};
    Object.keys(WEEK_DATA).forEach(date => {
      const saved = loadTasks(date);
      if (saved) {
        loadedTasks[date] = saved;
      } else {
        loadedTasks[date] = WEEK_DATA[date].tasks;
      }
    });
    setWeekTasks(loadedTasks);
    setIsLoaded(true);
    
    // Calculate progress
    updateProgress(loadedTasks);
  }, []);

  const updateProgress = (tasks: { [key: string]: Task[] }) => {
    let total = 0;
    let completed = 0;
    Object.keys(tasks).forEach(date => {
      tasks[date].forEach(task => {
        total++;
        if (task.completed) completed++;
      });
    });
    setTotalProgress(total === 0 ? 0 : Math.round((completed / total) * 100));
  };

  const toggleTask = (date: string, taskId: number, e?: React.MouseEvent | React.ChangeEvent) => {
    const newTasks = { ...weekTasks };
    const task = newTasks[date].find(t => t.id === taskId);
    
    if (task) {
      task.completed = !task.completed;
      setWeekTasks(newTasks);
      saveTasks(date, newTasks[date]);
      updateProgress(newTasks);

      // Trigger celebration on completion
      if (task.completed && e && 'clientX' in e) {
        createCelebration(e as React.MouseEvent);
      }
    }
  };

  const createCelebration = (e: React.MouseEvent) => {
    const id = Math.random().toString(36).substr(2, 9);
    const x = e.clientX;
    const y = e.clientY;
    
    setCelebrations(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setCelebrations(prev => prev.filter(c => c.id !== id));
    }, 1000);
  };

  const getDayProgress = (date: string) => {
    const tasks = weekTasks[date];
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
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

  return (
    <main className={styles.main}>
      {/* Celebration Particles */}
      {celebrations.map(celebration => (
        <div
          key={celebration.id}
          className={styles.celebration}
          style={{
            left: `${celebration.x}px`,
            top: `${celebration.y}px`,
          }}
        >
          ✨
        </div>
      ))}

      {/* Header */}
      <section className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>背筋ウィーク</h1>
            <p className={styles.subtitle}>
              7日間の人生リファクタリング。君を変える習慣システム。
            </p>
          </div>

          {/* Overall Progress */}
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>全体進捗</span>
              <span className={styles.progressValue}>{totalProgress}%</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
            <p className={styles.progressMessage}>
              {totalProgress === 0 && 'さあ、背筋を伸ばそう。'}
              {totalProgress > 0 && totalProgress < 50 && 'いいペースだ。続けよう。'}
              {totalProgress >= 50 && totalProgress < 100 && 'ほぼゴール。最後の一歩だ。'}
              {totalProgress === 100 && '完走おめでとう。君は新しい自分になった。'}
            </p>
          </div>
        </div>
      </section>

      {/* Days Grid */}
      <section className={styles.daysSection}>
        <div className={styles.container}>
          <div className={styles.daysGrid}>
            {dates.map((date, idx) => {
              const dayData = WEEK_DATA[date];
              const tasks = weekTasks[date] || [];
              const dayProgress = getDayProgress(date);
              const completedCount = tasks.filter(t => t.completed).length;

              return (
                <div
                  key={date}
                  className={`${styles.dayCard} ${styles[`color_${dayData.color}`]}`}
                  style={{ '--delay': `${idx * 0.1}s` } as any}
                >
                  {/* Day Header */}
                  <div className={styles.dayHeader}>
                    <div className={styles.dayInfo}>
                      <div className={styles.dateDisplay}>
                        <div className={styles.date}>{date}</div>
                        <div className={styles.dayOfWeek}>（{dayData.day}）</div>
                      </div>
                      <div className={styles.focusSection}>
                        <h3 className={styles.focusTitle}>{dayData.focus}</h3>
                        <p className={styles.inspiration}>{dayData.inspiration}</p>
                      </div>
                    </div>
                    <div className={styles.dayStats}>
                      <div className={styles.completedCount}>
                        {completedCount}/{tasks.length}
                      </div>
                      <div className={styles.milestone}>
                        <p className={styles.milestoneTitle}>{dayData.milestoneTitle}</p>
                        <p className={styles.milestoneDescription}>{dayData.milestoneDescription}</p>
                      </div>
                    </div>
                  </div>

                  {/* Day Progress */}
                  <div className={styles.dayProgressSection}>
                    <div className={styles.dayProgressBar}>
                      <div
                        className={styles.dayProgressFill}
                        style={{ width: `${dayProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className={styles.tasksList}>
                    {tasks.map((task, taskIdx) => (
                      <label
                        key={task.id}
                        className={`${styles.taskItem} ${
                          task.completed ? styles.taskCompleted : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) => toggleTask(date, task.id, e)}
                          className={styles.taskCheckbox}
                        />
                        <span className={styles.taskText}>{task.text}</span>
                        {task.completed && <span className={styles.taskCheck}>✓</span>}
                      </label>
                    ))}
                  </div>

                  {/* Sex Status */}
                  <div className={styles.sexStatusSection}>
                    <span className={styles.sexStatusLabel}>目標</span>
                    <span className={styles.sexStatusValue}>{dayData.sexStatus}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Daily Routine Reference */}
      <section className={styles.routineSection}>
        <div className={styles.container}>
          <h2>📋 デイリー・ルーティン（参考）</h2>
          <div className={styles.routineGrid}>
            <div className={styles.routineColumn}>
              <h3>Morning</h3>
              <ul className={styles.routineList}>
                <li><span className={styles.time}>08:00</span><span>起床 ＋ ビオデルマで洗顔</span></li>
                <li><span className={styles.time}>08:10</span><span>ビュッフェ塗布</span></li>
                <li><span className={styles.time}>08:30</span><span>日焼け止めを塗る</span></li>
                <li><span className={styles.time}>09:00</span><span>Deep Work（3時間）</span></li>
              </ul>
            </div>
            <div className={styles.routineColumn}>
              <h3>Night</h3>
              <ul className={styles.routineList}>
                <li><span className={styles.time}>19:00</span><span>銭湯 ＋ AHA洗顔</span></li>
                <li><span className={styles.time}>21:00</span><span>プロテイン + グルタミン</span></li>
                <li><span className={styles.time}>23:00</span><span>レチノイド塗布</span></li>
                <li><span className={styles.time}>24:00</span><span>就寝</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className={styles.footer}>
        <div className={styles.container}>
          <p>
            「背筋を伸ばす」とは、自分が何にリソースを割くかをデザインし直すこと。
          </p>
          <p className={styles.footerSmall}>
            明日、8時にアラームが鳴った時、君の「覇気」が試されますよ。
          </p>
        </div>
      </section>
    </main>
  );
}
