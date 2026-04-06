import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DAILY_SYSTEM = `あなたはパーソナルコーチです。ユーザーの1日のタスク達成状況、評価、コメントを元に、丁寧な振り返りレポートを日本語で書いてください。

ルール:
- 達成できたことを具体的に認め、なぜ良かったかを分析する
- 未達成のものには原因の推測と、明日からできる改善策を提案
- 今日の行動パターンから見える傾向を指摘
- 励ましの言葉で締める
- 全体で400字程度
- マークダウンは使わない、プレーンテキストで`;

const WEEKLY_SYSTEM = `あなたはパーソナルコーチです。ユーザーの1週間のタスク達成状況、日々のコメントを元に、詳細な週間レビューレポートを日本語で書いてください。

ルール:
- 1週間の全体的な達成度を数値を交えて評価
- 特に良かった日とその理由を具体的に分析
- 改善が必要な日とその要因を掘り下げる
- カテゴリ別（仕事、健康、習慣など）の達成傾向を分析
- 1週間を通じて見える成長ポイントや課題パターンを指摘
- 来週への具体的なアドバイスを3つ程度、優先度をつけて提案
- 全体のモチベーションを高める総括で締める
- 全体で1200字程度
- マークダウンは使わない、プレーンテキストで`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ success: false, error: 'パラメータ不足' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ success: false, error: 'APIキーが設定されていません' }, { status: 500 });
    }

    const systemPrompt = type === 'weekly' ? WEEKLY_SYSTEM : DAILY_SYSTEM;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: type === 'weekly' ? 2048 : 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: data }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response');
    }

    return NextResponse.json({ success: true, review: content.text });
  } catch (error: any) {
    console.error('ai-review error:', error);
    return NextResponse.json({ success: false, error: error.message || 'レビュー生成に失敗' }, { status: 400 });
  }
}
