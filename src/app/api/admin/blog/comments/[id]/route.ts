// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/blog/comments/[id] — تأیید/رد/حذفِ کامنت (DECISION-065)
//   PATCH  : { action: "approve" | "reject" } — blog.moderate
//   DELETE : حذفِ دائمی — blog.moderate
// commentCount مقاله فقط با کامنت‌های approved به‌روز می‌ماند (افزایش/کاهشِ اتمیک).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.moderate")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const c = await prisma.blogComment.findUnique({
    where: { id },
    select: { id: true, status: true, postId: true },
  });
  if (!c) return NextResponse.json({ error: "کامنت یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = b?.action;
  if (action !== "approve" && action !== "reject")
    return NextResponse.json({ error: "اکشن نامعتبر." }, { status: 400 });

  const nextStatus = action === "approve" ? "approved" : "rejected";
  if (nextStatus === c.status) return NextResponse.json({ ok: true }); // بدون تغییر

  const wasApproved = c.status === "approved";
  const willApprove = nextStatus === "approved";

  await prisma.$transaction(async (tx) => {
    await tx.blogComment.update({
      where: { id },
      data: { status: nextStatus, reviewedAt: getNow(), reviewedById: ctx.admin.id },
    });
    // به‌روزرسانیِ شمارندهٔ کامنتِ مقاله
    if (!wasApproved && willApprove) {
      await tx.blogPost.update({ where: { id: c.postId }, data: { commentCount: { increment: 1 } } });
    } else if (wasApproved && !willApprove) {
      await tx.blogPost.update({ where: { id: c.postId }, data: { commentCount: { decrement: 1 } } });
    }
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: `blog.comment.${action}`,
    targetType: "blog-comment",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.moderate")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const c = await prisma.blogComment.findUnique({
    where: { id },
    select: { status: true, postId: true },
  });
  if (!c) return NextResponse.json({ error: "کامنت یافت نشد." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.blogComment.delete({ where: { id } });
    if (c.status === "approved") {
      await tx.blogPost.update({ where: { id: c.postId }, data: { commentCount: { decrement: 1 } } });
    }
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "blog.comment.delete",
    targetType: "blog-comment",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
