// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/blog/tags — فهرستِ برچسب‌ها با شمارِ مقاله (DECISION-065)
// برچسب‌ها معمولاً خودکار از مقالات ساخته می‌شوند؛ این مسیر برای مرور/پاک‌سازی است.
//   GET : فهرست — blog.read
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const rows = await prisma.blogTag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, _count: { select: { posts: true } } },
  });

  return NextResponse.json({
    ok: true,
    tags: rows.map((t) => ({ id: t.id, slug: t.slug, name: t.name, postCount: t._count.posts })),
  });
}
