'use client';

import { useState } from 'react';
import { ParsedTask, TaskCategory } from '@/types/taskParsing';
import styles from './TaskConfirmationFlow.module.css';

const CATEGORY_DISPLAY: Record<TaskCategory, { label: string; icon: string; color: string }> = {
  morning: { label: 'Morning', icon: '☀️', color: '#f59e0b' },
  work: { label: 'Work', icon: '💻', color: '#6366f1' },
  evening: { label: 'Evening', icon: '🏋', color: '#10b981' },
  night: { label: 'Night', icon: '🌙', color: '#8b5cf6' },
};

interface TaskConfirmationFlowProps {
  tasks: ParsedTask[];
  date: string;
  onComplete: (tasks: ParsedTask[]) => void;
  onCancel: () => void;
}

export default function TaskConfirmationFlow({ tasks: initialTasks, date, onComplete, onCancel }: TaskConfirmationFlowProps) {
  const [tasks, setTasks] = useState<ParsedTask[]>(initialTasks.map(t => ({ ...t })));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const total = tasks.length;
  const current = tasks[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const progress = ((currentIndex + 1) / total) * 100;

  const updateCurrent = (updates: Partial<ParsedTask>) => {
    setTasks(prev => prev.map((t, i) => i === currentIndex ? { ...t, ...updates } : t));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/save-voice-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, date }),
      });

      const data = await res.json();

      if (!data.success) {
        setSaveError(data.error || '保存に失敗しました');
        return;
      }

      onComplete(tasks);
    } catch (e: any) {
      setSaveError('通信エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (isLast) {
      handleSave();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!current) return null;

  const cat = CATEGORY_DISPLAY[current.category];

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Progress */}
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressLabel}>
            <span className={styles.step}>{currentIndex + 1}</span>
            <span className={styles.stepSep}>/</span>
            <span className={styles.stepTotal}>{total}</span>
          </div>
        </div>

        {/* Task Card */}
        <div className={styles.card}>
          <div className={styles.categoryBadge} style={{ background: cat.color }}>
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </div>

          <div className={styles.taskField}>
            <label className={styles.fieldLabel}>タスク名</label>
            <input
              type="text"
              className={styles.taskInput}
              value={current.text}
              onChange={(e) => updateCurrent({ text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleNext();
                }
              }}
              autoFocus
              disabled={isSaving}
            />
          </div>

          <div className={styles.taskField}>
            <label className={styles.fieldLabel}>メモ</label>
            <textarea
              className={styles.memoInput}
              value={current.memo || ''}
              onChange={(e) => updateCurrent({ memo: e.target.value })}
              placeholder="メモ（任意）"
              rows={2}
              disabled={isSaving}
            />
          </div>

          <div className={styles.taskField}>
            <label className={styles.fieldLabel}>カテゴリー</label>
            <div className={styles.categoryGrid}>
              {Object.entries(CATEGORY_DISPLAY).map(([key, val]) => (
                <button
                  key={key}
                  className={`${styles.categoryBtn} ${current.category === key ? styles.categoryBtnActive : ''}`}
                  style={current.category === key ? { background: val.color, borderColor: val.color } : {}}
                  onClick={() => updateCurrent({ category: key as TaskCategory })}
                  disabled={isSaving}
                >
                  <span className={styles.categoryBtnIcon}>{val.icon}</span>
                  <span className={styles.categoryBtnLabel}>{val.label}</span>
                </button>
              ))}
            </div>
          </div>

          {current.time && (
            <div className={styles.timeBadge}>
              <span>&#128337;</span> {current.time}
            </div>
          )}
        </div>

        {saveError && <p className={styles.saveError}>{saveError}</p>}
        {!isSaving && <p className={styles.confirmText}>これで作成しますか？</p>}
        {isSaving && <p className={styles.savingText}>保存中...</p>}

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={isSaving}>
            キャンセル
          </button>
          <div className={styles.navBtns}>
            <button
              className={styles.prevBtn}
              onClick={handlePrev}
              disabled={isFirst || isSaving}
            >
              &#8592; 前へ
            </button>
            <button className={styles.nextBtn} onClick={handleNext} disabled={isSaving}>
              {isLast ? `完了 (${total}件追加)` : 'OK &#8594;'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
