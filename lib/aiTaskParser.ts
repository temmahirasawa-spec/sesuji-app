import { TaskCategory, ParsedTask, ParseVoiceResponse } from '@/types/taskParsing';

// ============================
// 仕事キーワード判定
// ============================

const WORK_KEYWORDS = [
  'MTG', 'ミーティング', '会議', 'メール', '返信', 'slack', 'スラック',
  'レビュー', 'デプロイ', 'コード', '実装', '修正', '開発', 'PR',
  'リリース', 'タスク', '報告', '提出', '見積', '請求', '納品',
  'クライアント', '打ち合わせ', 'プレゼン', '資料', 'ドキュメント',
  'YORKYS', 'ブランチ', 'サイト', 'デザイン', 'フロント', 'バック',
  'API', 'DB', 'サーバー', 'テスト', '確認', '対応', '連絡',
];

export function isWorkRelated(text: string): boolean {
  const normalized = text.toUpperCase();
  return WORK_KEYWORDS.some(kw => normalized.includes(kw.toUpperCase()));
}

// ============================
// 時刻抽出 + カテゴリ判定
// ============================

/**
 * テキストから時刻を抽出する
 * "14時から" → "14:00", "9:30に" → "09:30", "午後3時" → "15:00"
 */
export function extractTime(text: string): string | undefined {
  // "午前/午後X時Y分" パターン
  const ampmMatch = text.match(/(午前|午後)(\d{1,2})時(?:(\d{1,2})分)?/);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[2]);
    const min = ampmMatch[3] ? parseInt(ampmMatch[3]) : 0;
    if (ampmMatch[1] === '午後' && hour < 12) hour += 12;
    if (ampmMatch[1] === '午前' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }

  // "X時Y分" パターン
  const jpMatch = text.match(/(\d{1,2})時(?:(\d{1,2})分)?/);
  if (jpMatch) {
    const hour = parseInt(jpMatch[1]);
    const min = jpMatch[2] ? parseInt(jpMatch[2]) : 0;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }

  // "HH:MM" パターン
  const colonMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (colonMatch) {
    const hour = parseInt(colonMatch[1]);
    const min = parseInt(colonMatch[2]);
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }

  return undefined;
}

/**
 * 時刻からカテゴリを判定する
 * 5:00-11:59 → morning, 12:00-17:59 → work, 18:00-21:59 → evening, 22:00-4:59 → night
 */
export function categorizeByTime(time: string): TaskCategory {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'work';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * テキストからカテゴリを推定する（時刻 > キーワード > デフォルト）
 */
export function inferCategory(text: string): TaskCategory {
  const time = extractTime(text);
  if (time) return categorizeByTime(time);
  if (isWorkRelated(text)) return 'work';

  // 夜系キーワード
  const nightKeywords = ['就寝', '寝る', 'スキンケア', 'レチノイド', 'ボディケア', '風呂', '銭湯'];
  if (nightKeywords.some(kw => text.includes(kw))) return 'night';

  // 朝系キーワード
  const morningKeywords = ['起床', '朝食', '起きる', 'サプリ', '洗顔'];
  if (morningKeywords.some(kw => text.includes(kw))) return 'morning';

  // 運動系キーワード
  const eveningKeywords = ['筋トレ', 'ジム', 'トレーニング', 'ランニング', '散歩'];
  if (eveningKeywords.some(kw => text.includes(kw))) return 'evening';

  return 'morning'; // デフォルト
}

// ============================
// Claude API でタスク解析
// ============================

const PARSE_SYSTEM_PROMPT = `あなたはタスク管理アシスタントです。
ユーザーの音声入力テキストをタスクに分解してください。

ルール:
- 1つの発話に複数のタスクが含まれる場合は分割する
- 各タスクには簡潔なタスク名をつける
- 時刻が含まれていたら抽出する（HH:MM形式）
- カテゴリを判定する: morning（朝の活動）, work（仕事関連）, evening（運動・夕方）, night（夜・就寝前）
- 優先度を判定する: high（急ぎ・重要）, normal（通常）, low（余裕あり）

JSON配列で返してください:
[{"text": "タスク名", "category": "work", "time": "14:00", "priority": "normal"}]

時刻がない場合はtimeフィールドは省略。必ず有効なJSON配列のみを返してください。`;

export async function parseWithAI(transcript: string): Promise<ParseVoiceResponse> {
  try {
    const res = await fetch('/api/parse-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    const tasks: ParsedTask[] = data.tasks.map((t: any) => ({
      text: t.time ? `${t.time} ${t.text}` : t.text,
      category: t.category || inferCategory(t.text),
      time: t.time,
      priority: t.priority || 'normal',
      originalText: transcript,
    }));

    return { success: true, tasks, rawTranscript: transcript };
  } catch (error: any) {
    return { success: false, tasks: [], rawTranscript: transcript, error: error.message };
  }
}

/**
 * AI無しのフォールバック: ローカルでテキストを解析してタスク化
 */
export function parseLocally(transcript: string): ParseVoiceResponse {
  // 句読点や「と」「あと」で分割
  const parts = transcript
    .split(/[、。,.\n]|(?:と(?:あと)?|あと|それと|それから)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const tasks: ParsedTask[] = parts.map(part => ({
    text: extractTime(part) ? `${extractTime(part)} ${part.replace(/\d{1,2}[時:](\d{1,2}分?)?[にからまで]*/, '').trim() || part}` : part,
    category: inferCategory(part),
    time: extractTime(part),
    priority: 'normal',
    originalText: transcript,
  }));

  return { success: true, tasks, rawTranscript: transcript };
}

export { PARSE_SYSTEM_PROMPT };
