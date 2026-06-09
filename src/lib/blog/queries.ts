// ─────────────────────────────────────────────────────────────────────────────
// queries.ts — کوئری‌های سروریِ بلاگ برای صفحاتِ عمومی (DECISION-065)
// فقط خواندن. صفحاتِ سایت (Server Components) از این‌ها استفاده می‌کنند.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { POSTS_PER_PAGE } from "./constants";

export interface PostCardView {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  authorName: string;
  readingMinutes: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isFeatured: boolean;
  publishedAt: Date | null;
}

export interface PostFull extends PostCardView {
  id: string;
  shortCode: string;
  content: string;
  tags: { name: string; slug: string }[];
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface CategoryView {
  slug: string;
  name: string;
  count: number;
}

const CARD_SELECT = {
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  authorName: true,
  readingMinutes: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
  isFeatured: true,
  publishedAt: true,
  category: { select: { name: true, slug: true } },
} as const;

type CardRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string;
  readingMinutes: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isFeatured: boolean;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
};

function toCard(p: CardRow): PostCardView {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    categoryName: p.category?.name ?? null,
    categorySlug: p.category?.slug ?? null,
    authorName: p.authorName,
    readingMinutes: p.readingMinutes,
    viewCount: p.viewCount,
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    isFeatured: p.isFeatured,
    publishedAt: p.publishedAt,
  };
}

/** فهرستِ مقالاتِ منتشرشده با صفحه‌بندی و فیلترِ دستهٔ اختیاری. */
export async function getPublishedPosts(opts: {
  page?: number;
  categorySlug?: string | null;
}): Promise<{ posts: PostCardView[]; total: number; page: number; pageCount: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const where = {
    status: "published",
    ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: CARD_SELECT,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts: rows.map(toCard),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  };
}

/** مقالهٔ شاخص (isFeatured) برای بالای فهرست — جدیدترین. */
export async function getFeaturedPost(): Promise<PostCardView | null> {
  const row = await prisma.blogPost.findFirst({
    where: { status: "published", isFeatured: true },
    select: CARD_SELECT,
    orderBy: [{ publishedAt: "desc" }],
  });
  return row ? toCard(row) : null;
}

/** یک مقالهٔ کاملِ منتشرشده با دسته و برچسب‌ها. */
export async function getPostBySlug(slug: string): Promise<PostFull | null> {
  const p = await prisma.blogPost.findFirst({
    where: { slug, status: "published" },
    select: {
      ...CARD_SELECT,
      id: true,
      shortCode: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });
  if (!p) return null;
  return {
    ...toCard(p),
    id: p.id,
    shortCode: p.shortCode,
    content: p.content,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    tags: p.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
  };
}

/** مقالاتِ مرتبط (هم‌دسته) — به‌جز خودِ مقاله. */
export async function getRelatedPosts(
  slug: string,
  categorySlug: string | null,
  limit = 3
): Promise<PostCardView[]> {
  if (!categorySlug) return [];
  const rows = await prisma.blogPost.findMany({
    where: {
      status: "published",
      slug: { not: slug },
      category: { slug: categorySlug },
    },
    select: CARD_SELECT,
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
  });
  return rows.map(toCard);
}

/** دسته‌های فعال با شمارِ مقالاتِ منتشرشده (برای نوارِ فیلتر). */
export async function getCategoriesWithCount(): Promise<CategoryView[]> {
  const cats = await prisma.blogCategory.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      slug: true,
      name: true,
      _count: { select: { posts: { where: { status: "published" } } } },
    },
  });
  return cats.map((c) => ({ slug: c.slug, name: c.name, count: c._count.posts }));
}

export interface CommentView {
  id: string;
  authorName: string;
  body: string;
  isAdminReply: boolean;
  createdAt: Date;
  replies: CommentView[];
}

/** کامنت‌های تأییدشدهٔ یک مقاله، به‌صورتِ درختیِ یک‌سطح (ریشه + پاسخ‌ها). */
export async function getApprovedComments(postId: string): Promise<CommentView[]> {
  const rows = await prisma.blogComment.findMany({
    where: { postId, status: "approved" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      parentId: true,
      authorName: true,
      body: true,
      isAdminReply: true,
      createdAt: true,
    },
  });

  const roots: (CommentView & { parentId: string | null })[] = [];
  const byId = new Map<string, CommentView>();

  for (const r of rows) {
    const node: CommentView = {
      id: r.id,
      authorName: r.authorName,
      body: r.body,
      isAdminReply: r.isAdminReply,
      createdAt: r.createdAt,
      replies: [],
    };
    byId.set(r.id, node);
    if (r.parentId && byId.has(r.parentId)) {
      byId.get(r.parentId)!.replies.push(node);
    } else {
      roots.push({ ...node, parentId: r.parentId });
    }
  }

  return roots.map(({ parentId: _p, ...n }) => n);
}
