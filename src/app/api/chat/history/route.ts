import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// دریافت تاریخچه چت
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const chatType = searchParams.get('chatType') || 'general';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'شناسه کاربری الزامی است' },
        { status: 400 }
      );
    }

    // دریافت تاریخچه چت
    const messages = await db.chatMessage.findMany({
      where: {
        userId,
        chatType,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error in chat history API:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تاریخچه چت' },
      { status: 500 }
    );
  }
}
