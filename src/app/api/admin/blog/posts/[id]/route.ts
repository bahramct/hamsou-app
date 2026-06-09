// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/blog/posts/[id] — مشاهده/ویرایش/حذفِ یک مقاله (DECISION-065)
//   GET    : دادهٔ کاملِ ویرایش — blog.read
//   PATCH  : ویرایش — blog.write
//   DELETE : حذف — blog.write
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import {
  ensureUniqueSlug,
  syncPostTags,
  resolvePublishedAt,
} from "@/lib/blog/admin";
import { calcReadingMinutes, makeExcerpt } from "@/lib/blog/utils";
import { POST_STATUSES } from "@/lib/blog/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const p = await prisma.blogPost.findUnique({
    where: { id },
    include: { tags: { select: { tag: { select: { name: true } } } } },
  });
  if (!p) return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });

  return NextResponse.json({
    ok: true,
    post: {
      id: p.id,
      slug: p.slug,
      shortCode: p.shortCode,
      title: p.title,
      excerpt: p.excerpt ?? "",
      content: p.content,
      coverImage: p.coverImage,
      categoryId: p.categoryId,
      authorName: p.authorName,
      status: p.status,
      isFeatured: p.isFeatured,
      metaTitle: p.metaTitle ?? "",
      metaDescription: p.metaDescription ?? "",
      tags: p.tags.map((t) => t.tag.name),
      viewCount: p.viewCount,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
  if (!existing) return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "ورودی نامعتبر." }, { status: 400 });

  const title = typeof b.title === "string" ? b.title.trim() : "";
  const content = typeof b.content === "string" ? b.content : "";
  if (!title) return NextResponse.json({ error: "عنوان لازم است." }, { status: 400 });
  if (!content.trim()) return NextResponse.json({ error: "متنِ مقاله لازم است." }, { status: 400 });

  const status = POST_STATUSES.includes(b.status as never) ? (b.status as string) : existing.status;

  // slug فقط اگر کاربر صریحاً عوض کرد دوباره یکتا می‌شود
  let slug = existing.slug;
  if (typeof b.slug === "string" && b.slug.trim() && b.slug.trim() !== existing.slug) {
    slug = await ensureUniqueSlug(b.slug, id);
  }

  const excerpt =
    typeof b.excerpt === "string" && b.excerpt.trim() ? b.excerpt.trim() : makeExcerpt(content);

  await prisma.blogPost.update({
    where: { id },
    data: {
      slug,
      title,
      excerpt,
      content,
      coverImage: typeof b.coverImage === "string" ? (b.coverImage || null) : undefined,
      categoryId: typeof b.categoryId === "string" ? (b.categoryId || null) : undefined,
      authorName: typeof b.authorName === "string" && b.authorName.trim() ? b.authorName.trim() : undefined,
      status,
      isFeatured: typeof b.isFeatured === "boolean" ? b.isFeatured : undefined,
      readingMinutes: calcReadingMinutes(content),
      metaTitle: typeof b.metaTitle === "string" ? (b.metaTitle.trim() || null) : undefined,
      metaDescription: typeof b.metaDescription === "string" ? (b.metaDescription.trim() || null) : undefined,
      publishedAt: resolvePublishedAt(status, existing.publishedAt),
    },
  });

  if (Array.isArray(b.tags)) {
    await syncPostTags(id, b.tags.filter((t): t is string => typeof t === "string"));
  }

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "blog.post.update",
    targetType: "blog-post",
    targetId: id,
    meta: { title, status },
  });

  return NextResponse.json({ ok: true, slug });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "blog.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const p = await prisma.blogPost.findUnique({ where: { id }, select: { title: true } });
  if (!p) return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });

  await prisma.blogPost.delete({ where: { id } });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "blog.post.delete",
    targetType: "blog-post",
    targetId: id,
    meta: { title: p.title },
  });

  return NextResponse.json({ ok: true });
}
