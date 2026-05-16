import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema برای ایجاد پست
const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  postType: z.enum(['achievement', 'reflection', 'update', 'challenge']).default('achievement'),
  metadata: z.string().optional(), // JSON string
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
});

// POST /api/community/posts - ایجاد پست جدید
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    const body = await request.json();

    // اعتبارسنجی
    const validatedData = createPostSchema.parse(body);

    // ایجاد پست
    const post = await db.post.create({
      data: {
        userId: user.id,
        content: validatedData.content,
        postType: validatedData.postType,
        metadata: validatedData.metadata,
        visibility: validatedData.visibility,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        isLiked: false,
      },
    });
  } catch (error: any) {
    console.error('Error creating post:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد پست' },
      { status: 500 }
    );
  }
}
