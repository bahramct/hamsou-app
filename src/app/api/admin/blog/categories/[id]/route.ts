// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/blog/categories/[id] — ویرایش/حذفِ دسته (DECISION-065)
//   PATCH  : ویرایش — blog.write
//   DELETE : حذف (مقالاتِ مرتبط بدون‌دسته می‌شوند) — blog.write
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { slugify } from "@/lib/blog/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.blogCategory.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) return NextResponse.json({ error: "دسته یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  if (!name) return NextResponse.json({ error: "نامِ دسته لازم است." }, { status: 400 });

  let slug = existing.slug;
  if (typeof b?.slug === "string" && b.slug.trim()) {
    const next = slugify(b.slug);
    if (next !== existing.slug) {
      const dup = await prisma.blogCategory.findFirst({ where: { slug: next, id: { not: id } }, select: { id: true } });
      if (dup) return NextResponse.json({ error: "این نشانیِ دسته از قبل وجود دارد." }, { status: 400 });
      slug = next;
    }
  }

  await prisma.blogCategory.update({
    where: { id },
    data: {
      slug,
      name,
      description: typeof b?.description === "string" ? (b.description.trim() || null) : undefined,
      order: typeof b?.order === "number" ? b.order : undefined,
      isActive: typeof b?.isActive === "boolean" ? b.isActive : undefined,
    },
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "blog.category.update",
    targetType: "blog-category",
    targetId: id,
    meta: { name },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const cat = await prisma.blogCategory.findUnique({ where: { id }, select: { name: true } });
  if (!cat) return NextResponse.json({ error: "دسته یافت نشد." }, { status: 404 });

  // مقالاتِ این دسته بدون‌دسته می‌شوند (categoryId روی SetNull نیست → دستی)
  await prisma.blogPost.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await prisma.blogCategory.delete({ where: { id } });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "blog.category.delete",
    targetType: "blog-category",
    targetId: id,
    meta: { name: cat.name },
  });

  return NextResponse.json({ ok: true });
}
