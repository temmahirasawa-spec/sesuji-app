'use client';

import { useState, useEffect } from 'react';
import { ParsedTask } from '@/types/taskParsing';
import TaskConfirmationFlow from './TaskConfirmationFlow';
import styles from './VoiceInput.module.css';

interface VoiceInputProps {
  date: string;
  onTasksConfirmed: (tasks: ParsedTask[]) => void;
}

export default function VoiceInput({ date, onTasksConfirmed }: VoiceInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 成功メッセージを3秒後に消す
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const handleParse = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input.trim() }),
      });

      const data = await res.json();

      if (!data.success || data.tasks.length === 0) {
        setError(data.error || 'タスクを解析できませんでした');
        return;
      }

      setParsedTasks(data.tasks);
    } catch (e: any) {
      setError('通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (tasks: ParsedTask[]) => {
    onTasksConfirmed(tasks);
    setParsedTasks(null);
    setInput('');
    setSuccessMsg(`${tasks.length}個のタスクを追加しました`);
  };

  const handleCancel = () => {
    setParsedTasks(null);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.inputRow}>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="朝のルーティン追加して、それからENEOS..."
            rows={2}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleParse();
              }
            }}
          />
          <button
            className={styles.parseBtn}
            onClick={handleParse}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <span className={styles.loading}>AI が解析中...&#9203;</span>
            ) : (
              <span>AI 解析</span>
            )}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {successMsg && <p className={styles.success}>{successMsg}</p>}
      </div>

      {parsedTasks && (
        <TaskConfirmationFlow
          tasks={parsedTasks}
          date={date}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
