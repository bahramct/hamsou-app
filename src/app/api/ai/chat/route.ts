import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

// Validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
  systemPromptType: z.enum([
    'CHAT_BOT',
    'ANALYTICS_COACH',
    'COMMITMENT_SUGGESTER',
    'SENTIMENT_ANALYZER',
    'REPORT_GENERATOR',
    'IMPROVEMENT_GUIDE',
    'GOAL_SUGGESTER',
    'GENERIC',
  ]).optional().default('CHAT_BOT'),
  customSystemPrompt: z.string().optional(),
});

// تأیید توکن
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. احراز هویت
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const { message, history, systemPromptType, customSystemPrompt } = chatRequestSchema.parse(body);

    // 3. اگر customSystemPrompt داده شده، از آن استفاده می‌کنیم
    if (customSystemPrompt) {
      // استفاده از AI Provider مستقیماً با system prompt سفارشی
      const provider = aiService.getProviderInfo();
      const { aiClient } = await import('@/lib/ai');

      const response = await aiClient.getProvider().chat({
        messages: [...history, { role: 'user' as const, content: message }],
        systemPrompt: customSystemPrompt,
        temperature: 0.7,
      });

      return NextResponse.json({
        success: true,
        content: response.content,
        usage: response.usage,
        provider: provider.name,
      });
    }

    // 4. استفاده از aiService با context کاربر و system prompt پیش‌فرض
    const response = await aiService.chat(
      decoded.userId,
      message,
      history
    );

    return NextResponse.json({
      success: true,
      content: response.content,
      usage: response.usage,
      model: response.model,
    });

  } catch (error: any) {
    console.error('[API] AI Chat Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'خطا در ورودی‌ها',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'خطا در ارتباط با AI',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. احراز هویت
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // 2. Health check و اطلاعات Provider
    const health = await aiService.healthCheck();
    const providerInfo = aiService.getProviderInfo();

    return NextResponse.json({
      success: true,
      health,
      provider: providerInfo,
      availableSystemPrompts: [
        'CHAT_BOT',
        'ANALYTICS_COACH',
        'COMMITMENT_SUGGESTER',
        'SENTIMENT_ANALYZER',
        'REPORT_GENERATOR',
        'IMPROVEMENT_GUIDE',
        'GOAL_SUGGESTER',
        'GENERIC',
      ],
    });

  } catch (error: any) {
    console.error('[API] AI Chat GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'خطا در دریافت اطلاعات AI',
      },
      { status: 500 }
    );
  }
}
