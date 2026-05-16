import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiService } from '@/lib/ai';

// ارسال پیام به AI
export async function POST(req: NextRequest) {
  try {
    const { message, userId, chatType = 'general' } = await req.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'پیام و شناسه کاربری الزامی است' },
        { status: 400 }
      );
    }

    // دریافت اطلاعات کاربر
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // دریافت تاریخچه چت اخیر
    const recentMessages = await db.chatMessage.findMany({
      where: {
        userId,
        chatType,
      },
      orderBy: { createdAt: 'asc' },
      take: 20, // فقط 20 پیام آخر برای context
    });

    // ذخیره پیام کاربر
    await db.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
        chatType,
      },
    });

    // تبدیل تاریخچه به فرمت مورد نیاز AI
    const chatHistory = recentMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // ارسال پیام به AI
    const aiResponse = await aiService.chat(userId, message, chatHistory);

    // ذخیره پاسخ AI
    await db.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: aiResponse.content,
        chatType,
        metadata: JSON.stringify({
          model: 'zai',
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      response: aiResponse.content,
    });
  } catch (error) {
    console.error('Error in chat send API:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال پیام' },
      { status: 500 }
    );
  }
}
