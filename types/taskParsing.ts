export type TaskCategory = 'morning' | 'work' | 'evening' | 'night';

export interface ParsedTask {
  text: string;
  category: TaskCategory;
  time?: string;        // "14:00" など抽出された時刻
  priority?: 'high' | 'normal' | 'low';
  memo?: string;
  originalText: string; // 音声入力の元テキスト
}

export interface ParseVoiceResponse {
  success: boolean;
  tasks: ParsedTask[];
  rawTranscript: string;  // 音声認識の生テキスト
  error?: string;
}
