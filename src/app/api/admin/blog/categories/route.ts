// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/blog/categories — فهرست + ساختِ دسته (DECISION-065)
//   GET  : فهرست با شمارِ مقاله — blog.read
//   POST : ساخت — blog.write
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { slugify } from "@/lib/blog/utils";

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const rows = await prisma.blogCategory.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      order: true,
      isActive: true,
      _count: { select: { posts: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    categories: rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      order: c.order,
      isActive: c.isActive,
      postCount: c._count.posts,
    })),
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  if (!name) return NextResponse.json({ error: "نامِ دسته لازم است." }, { status: 400 });

  const slug = typeof b?.slug === "string" && b.slug.trim() ? slugify(b.slug) : slugify(name);
  const dup = await prisma.blogCategory.findUnique({ where: { slug }, select: { id: true } });
  if (dup) return NextResponse.json({ error: "این نشانیِ دسته از قبل وجود دارد." }, { status: 400 });

  const created = await prisma.blogCategory.create({
    data: {
      slug,
      name,
      description: typeof b?.description === "string" && b.description.trim() ? b.description.trim() : null,
      order: typeof b?.order === "number" ? b.order : 0,
      isActive: b?.isActive !== false,
    },
    select: { id: true },
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "blog.category.create",
    targetType: "blog-category",
    targetId: created.id,
    meta: { name },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
