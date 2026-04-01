'use client';

import { useState } from 'react';
import { ParsedTask, TaskCategory } from '@/types/taskParsing';
import styles from './ParseResultPopup.module.css';

const CATEGORY_DISPLAY: Record<TaskCategory, { label: string; icon: string }> = {
  morning: { label: 'Morning', icon: '☀️' },
  work: { label: 'Work', icon: '💻' },
  evening: { label: 'Evening', icon: '🏋' },
  night: { label: 'Night', icon: '🌙' },
};

interface ParseResultPopupProps {
  tasks: ParsedTask[];
  onConfirm: (tasks: ParsedTask[]) => void;
  onClose: () => void;
}

export default function ParseResultPopup({ tasks: initialTasks, onConfirm, onClose }: ParseResultPopupProps) {
  const [tasks, setTasks] = useState<ParsedTask[]>(initialTasks);

  const updateTask = (index: number, updates: Partial<ParsedTask>) => {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, ...updates } : t));
  };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>解析結果</h3>
          <span className={styles.count}>{tasks.length}件</span>
        </div>

        <div className={styles.taskList}>
          {tasks.map((task, i) => {
            const cat = CATEGORY_DISPLAY[task.category];
            return (
              <div key={i} className={styles.taskCard}>
                <div className={styles.taskMain}>
                  <input
                    type="text"
                    className={styles.taskText}
                    value={task.text}
                    onChange={(e) => updateTask(i, { text: e.target.value })}
                  />
                  <button className={styles.removeBtn} onClick={() => removeTask(i)} title="削除">&#10005;</button>
                </div>
                <div className={styles.taskMeta}>
                  <select
                    className={styles.categorySelect}
                    value={task.category}
                    onChange={(e) => updateTask(i, { category: e.target.value as TaskCategory })}
                  >
                    {Object.entries(CATEGORY_DISPLAY).map(([key, val]) => (
                      <option key={key} value={key}>{val.icon} {val.label}</option>
                    ))}
                  </select>
                  {task.time && <span className={styles.time}>{task.time}</span>}
                  {task.priority === 'high' && <span className={styles.priorityHigh}>HIGH</span>}
                </div>
              </div>
            );
          })}
        </div>

        {tasks.length === 0 && (
          <p className={styles.empty}>タスクがありません</p>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>キャンセル</button>
          <button
            className={styles.confirmBtn}
            onClick={() => onConfirm(tasks)}
            disabled={tasks.length === 0}
          >
            {tasks.length}件を追加
          </button>
        </div>
      </div>
    </div>
  );
}
