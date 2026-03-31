import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { ParsedTask } from '@/types/taskParsing';
import { Task } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tasks, date }: { tasks: ParsedTask[]; date: string } = body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ success: false, error: 'タスクが空です' }, { status: 400 });
    }
    if (!date || typeof date !== 'string') {
      return NextResponse.json({ success: false, error: '日付が指定されていません' }, { status: 400 });
    }

    const client = getServerClient();
    if (!client) {
      return NextResponse.json({ success: false, error: 'データベース接続エラー' }, { status: 500 });
    }

    // 既存の today タスクを取得
    const key = `tasks_${date}_today`;
    const { data: existing } = await client
      .from('sesuji_data')
      .select('data')
      .eq('id', key)
      .maybeSingle();

    const existingTasks: Task[] = existing?.data || [];
    const maxId = existingTasks.length > 0 ? Math.max(...existingTasks.map(t => t.id)) : 0;

    // 新しいタスクを既存構造にマージ
    const newTasks: Task[] = tasks.map((t, i) => ({
      id: maxId + 1 + i,
      text: t.text,
      completed: false,
      category: t.category,
    }));

    const merged = [...existingTasks, ...newTasks];

    // Supabase に保存
    const { error } = await client
      .from('sesuji_data')
      .upsert({ id: key, data: merged, updated_at: new Date().toISOString() });

    if (error) {
      console.error('save-voice-tasks upsert error:', error);
      return NextResponse.json({ success: false, error: '保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, savedTasks: newTasks });
  } catch (error: any) {
    console.error('save-voice-tasks error:', error);
    return NextResponse.json({ success: false, error: error.message || '保存に失敗しました' }, { status: 400 });
  }
}
