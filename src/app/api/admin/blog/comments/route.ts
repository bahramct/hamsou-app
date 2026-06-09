// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/blog/comments — صفِ کامنت‌ها برای مدیریت (DECISION-065)
//   GET : فهرست با فیلترِ وضعیت (پیش‌فرض pending) — blog.moderate
// ایمیلِ کامنت‌گذار فقط اینجا (پنل) دیده می‌شود، نه در سایت.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { COMMENT_STATUSES } from "@/lib/blog/constants";

export async function GET(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.moderate")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const statusParam = req.nextUrl.searchParams.get("status") ?? "pending";
  const where =
    statusParam === "all"
      ? {}
      : COMMENT_STATUSES.includes(statusParam as never)
      ? { status: statusParam }
      : { status: "pending" };

  const rows = await prisma.blogComment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      authorName: true,
      authorEmail: true,
      body: true,
      status: true,
      isAdminReply: true,
      parentId: true,
      createdAt: true,
      post: { select: { title: true, slug: true } },
      parent: { select: { authorName: true, body: true } },
    },
  });

  const counts = await prisma.blogComment.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countByStatus: Record<string, number> = {};
  for (const c of counts) countByStatus[c.status] = c._count._all;

  return NextResponse.json({
    ok: true,
    counts: countByStatus,
    comments: rows.map((c) => ({
      id: c.id,
      authorName: c.authorName,
      authorEmail: c.authorEmail,
      body: c.body,
      status: c.status,
      isAdminReply: c.isAdminReply,
      parentId: c.parentId,
      createdAt: c.createdAt,
      postTitle: c.post.title,
      postSlug: c.post.slug,
      parentAuthor: c.parent?.authorName ?? null,
      parentExcerpt: c.parent ? c.parent.body.slice(0, 80) : null,
    })),
  });
}
