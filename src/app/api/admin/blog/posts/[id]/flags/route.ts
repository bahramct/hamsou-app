// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/blog/posts/[id]/flags — تغییرِ سریعِ وضعیت/شاخص (DECISION-065)
// برای toggleهای لیست (انتشار/پیش‌نویس، شاخص) بدون نیاز به ارسالِ کلِ مقاله.
// blog.write لازم است.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { resolvePublishedAt } from "@/lib/blog/admin";
import { POST_STATUSES } from "@/lib/blog/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { status: true, publishedAt: true },
  });
  if (!existing) return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const data: { status?: string; isFeatured?: boolean; publishedAt?: Date | null } = {};

  if (typeof b?.status === "string" && POST_STATUSES.includes(b.status as never)) {
    data.status = b.status;
    data.publishedAt = resolvePublishedAt(b.status, existing.publishedAt);
  }
  if (typeof b?.isFeatured === "boolean") {
    data.isFeatured = b.isFeatured;
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "تغییری ارسال نشد." }, { status: 400 });

  await prisma.blogPost.update({ where: { id }, data });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "blog.post.flags",
    targetType: "blog-post",
    targetId: id,
    meta: data as Record<string, unknown>,
  });

  return NextResponse.json({ ok: true });
}
