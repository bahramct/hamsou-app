// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/blog/tags/[id] — حذفِ برچسب (DECISION-065)
//   DELETE : حذف (رابطه‌های مقاله نیز cascade) — blog.write
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const tag = await prisma.blogTag.findUnique({ where: { id }, select: { name: true } });
  if (!tag) return NextResponse.json({ error: "برچسب یافت نشد." }, { status: 404 });

  await prisma.blogTag.delete({ where: { id } });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "blog.tag.delete",
    targetType: "blog-tag",
    targetId: id,
    meta: { name: tag.name },
  });

  return NextResponse.json({ ok: true });
}
