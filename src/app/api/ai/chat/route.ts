import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// یک instance از ZAI برای استفاده مجدد
let zaiInstance: any = null;

async function getZAIInstance() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, temperature, responseFormat } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages آرایه‌ای از پیام‌ها باید باشد' },
        { status: 400 }
      );
    }

    const zai = await getZAIInstance();

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
      temperature: temperature || 0.7,
      // در آینده می‌توانیم responseFormat را اضافه کنیم اگر SDK پشتیبانی کند
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('پاسخ خالی از AI دریافت شد');
    }

    return NextResponse.json({
      success: true,
      content,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'خطا در ارتباط با AI: ' + error.message },
      { status: 500 }
    );
  }
}
