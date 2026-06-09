// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/blog/posts — فهرست + ساختِ مقاله (DECISION-065)
//   GET  : فهرست (با فیلترِ وضعیت/جستجو) — blog.read
//   POST : ساختِ مقاله — blog.write
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import {
  ensureUniqueSlug,
  ensureUniqueShortCode,
  syncPostTags,
  resolvePublishedAt,
} from "@/lib/blog/admin";
import { calcReadingMinutes, makeExcerpt } from "@/lib/blog/utils";
import { POST_STATUSES } from "@/lib/blog/constants";

export async function GET(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status");
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const rows = await prisma.blogPost.findMany({
    where: {
      ...(status && POST_STATUSES.includes(status as never) ? { status } : {}),
      ...(q ? { title: { contains: q } } : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      isFeatured: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      readingMinutes: true,
      publishedAt: true,
      updatedAt: true,
      category: { select: { name: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    posts: rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      isFeatured: p.isFeatured,
      viewCount: p.viewCount,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      readingMinutes: p.readingMinutes,
      categoryName: p.category?.name ?? null,
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "ورودی نامعتبر." }, { status: 400 });

  const title = typeof b.title === "string" ? b.title.trim() : "";
  const content = typeof b.content === "string" ? b.content : "";
  if (!title) return NextResponse.json({ error: "عنوان لازم است." }, { status: 400 });
  if (!content.trim()) return NextResponse.json({ error: "متنِ مقاله لازم است." }, { status: 400 });

  const status = POST_STATUSES.includes(b.status as never) ? (b.status as string) : "draft";
  const slug = await ensureUniqueSlug(typeof b.slug === "string" && b.slug.trim() ? b.slug : title);
  const shortCode = await ensureUniqueShortCode();
  const excerpt =
    typeof b.excerpt === "string" && b.excerpt.trim() ? b.excerpt.trim() : makeExcerpt(content);

  const created = await prisma.blogPost.create({
    data: {
      slug,
      shortCode,
      title,
      excerpt,
      content,
      coverImage: typeof b.coverImage === "string" && b.coverImage ? b.coverImage : null,
      categoryId: typeof b.categoryId === "string" && b.categoryId ? b.categoryId : null,
      authorName: typeof b.authorName === "string" && b.authorName.trim() ? b.authorName.trim() : "تیم همسو",
      status,
      isFeatured: b.isFeatured === true,
      readingMinutes: calcReadingMinutes(content),
      metaTitle: typeof b.metaTitle === "string" && b.metaTitle.trim() ? b.metaTitle.trim() : null,
      metaDescription: typeof b.metaDescription === "string" && b.metaDescription.trim() ? b.metaDescription.trim() : null,
      publishedAt: resolvePublishedAt(status, null),
      createdById: ctx.admin.id,
    },
    select: { id: true },
  });

  if (Array.isArray(b.tags)) {
    await syncPostTags(created.id, b.tags.filter((t): t is string => typeof t === "string"));
  }

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "blog.post.create",
    targetType: "blog-post",
    targetId: created.id,
    meta: { title, status },
  });

  return NextResponse.json({ ok: true, id: created.id, slug });
}
