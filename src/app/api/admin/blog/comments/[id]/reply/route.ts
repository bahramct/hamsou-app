// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/blog/comments/[id]/reply — پاسخِ رسمیِ «همسو» (DECISION-065)
// پاسخ به‌صورتِ کامنتِ تأییدشدهٔ isAdminReply ثبت می‌شود (یک‌سطح، زیرِ کامنتِ ریشه).
// blog.moderate لازم است. commentCount مقاله +۱.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { COMMENT_MAX_LEN } from "@/lib/blog/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.moderate")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const parent = await prisma.blogComment.findUnique({
    where: { id },
    select: { id: true, postId: true, parentId: true },
  });
  if (!parent) return NextResponse.json({ error: "کامنتِ مرجع یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const body = typeof b?.body === "string" ? b.body.trim() : "";
  if (!body || body.length > COMMENT_MAX_LEN)
    return NextResponse.json({ error: "متنِ پاسخ را درست وارد کن." }, { status: 400 });

  // پاسخ همیشه به کامنتِ ریشه می‌چسبد (ساختارِ یک‌سطح)
  const rootId = parent.parentId ?? parent.id;

  await prisma.$transaction(async (tx) => {
    await tx.blogComment.create({
      data: {
        postId: parent.postId,
        parentId: rootId,
        authorName: ctx.admin.displayName || "همسو",
        authorEmail: "",
        body,
        status: "approved",
        isAdminReply: true,
        authorAdminId: ctx.admin.id,
        reviewedAt: getNow(),
        reviewedById: ctx.admin.id,
      },
    });
    await tx.blogPost.update({ where: { id: parent.postId }, data: { commentCount: { increment: 1 } } });
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "blog.comment.reply",
    targetType: "blog-comment",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
