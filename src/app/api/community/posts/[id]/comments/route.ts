import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema برای ایجاد کامنت
const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().optional(), // برای پاسخ به کامنت دیگر
});

// GET /api/community/posts/[id]/comments - دریافت کامنت‌های پست
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    const postId = params.id;

    const comments = await db.comment.findMany({
      where: {
        postId: postId,
        parentId: null, // فقط کامنت‌های اصلی
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت کامنت‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/community/posts/[id]/comments - ایجاد کامنت جدید
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    const postId = params.id;

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // بررسی وجود پست
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'پست یافت نشد' },
        { status: 404 }
      );
    }

    // اگر parentId وجود دارد، بررسی وجود کامنت والد
    if (validatedData.parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { success: false, error: 'کامنت والد یافت نشد' },
          { status: 404 }
        );
      }
    }

    // ایجاد کامنت
    const comment = await db.comment.create({
      data: {
        userId: user.id,
        postId: postId,
        content: validatedData.content,
        parentId: validatedData.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    // بروزرسانی تعداد کامنت‌های پست
    if (!validatedData.parentId) {
      await db.post.update({
        where: { id: postId },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد کامنت' },
      { status: 500 }
    );
  }
}
