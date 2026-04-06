import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DAILY_SYSTEM = `あなたはパーソナルコーチです。ユーザーの1日のタスク達成状況、評価、コメントを元に、短くて的確な振り返りレポートを日本語で書いてください。

ルール:
- 達成できたことを認める
- 未達成のものには改善策を1つだけ提案
- 励ましの言葉で締める
- 全体で200字程度でコンパクトに
- マークダウンは使わない、プレーンテキストで`;

const WEEKLY_SYSTEM = `あなたはパーソナルコーチです。ユーザーの1週間のタスク達成状況、日々のコメントを元に、週間レビューレポートを日本語で書いてください。

ルール:
- 1週間の全体的な達成度を評価
- 特に良かった日とその理由
- 来週への具体的なアドバイスを1-2つ
- 全体で300字程度
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
      max_tokens: 512,
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
