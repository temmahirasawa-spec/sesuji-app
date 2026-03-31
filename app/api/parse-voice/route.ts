import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ParsedTask, ParseVoiceResponse } from '@/types/taskParsing';
import { inferCategory, extractTime, PARSE_SYSTEM_PROMPT, parseLocally } from '@/lib/aiTaskParser';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userInput } = body;

    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return NextResponse.json(
        { success: false, tasks: [], rawTranscript: '', error: '入力テキストが空です' } satisfies ParseVoiceResponse,
        { status: 400 }
      );
    }

    const transcript = userInput.trim();

    // API キーがない場合はローカル解析にフォールバック
    if (!process.env.ANTHROPIC_API_KEY) {
      const localResult = parseLocally(transcript);
      return NextResponse.json(localResult);
    }

    // Claude API でタスク解析
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: PARSE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: transcript }],
    });

    // レスポンスからテキストを取得
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    // JSONを抽出（コードブロックで囲まれている場合も対応）
    let jsonText = content.text.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) {
      throw new Error('Claude API returned non-array response');
    }

    const tasks: ParsedTask[] = parsed.map((t: any) => ({
      text: t.time ? `${t.time} ${t.text}` : t.text,
      category: t.category || inferCategory(t.text),
      time: t.time || extractTime(t.text),
      priority: t.priority || 'normal',
      originalText: transcript,
    }));

    const response: ParseVoiceResponse = {
      success: true,
      tasks,
      rawTranscript: transcript,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('parse-voice error:', error);

    // JSON パースエラーやAPI エラーの場合、ローカル解析にフォールバック
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.userInput) {
        const localResult = parseLocally(body.userInput.trim());
        return NextResponse.json(localResult);
      }
    } catch {}

    return NextResponse.json(
      { success: false, tasks: [], rawTranscript: '', error: error.message || '解析に失敗しました' } satisfies ParseVoiceResponse,
      { status: 400 }
    );
  }
}
