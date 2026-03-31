'use client';

import { useState } from 'react';
import { ParsedTask } from '@/types/taskParsing';
import ParseResultPopup from './ParseResultPopup';
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

  const handleParse = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);

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

  const handleConfirm = (tasks: ParsedTask[]) => {
    onTasksConfirmed(tasks);
    setParsedTasks(null);
    setInput('');
  };

  const handleClose = () => {
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
      </div>

      {parsedTasks && (
        <ParseResultPopup
          tasks={parsedTasks}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      )}
    </>
  );
}
