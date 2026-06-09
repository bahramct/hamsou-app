// ─────────────────────────────────────────────────────────────────────────────
// /admin/blog — فهرستِ مقالات (DECISION-065)
// enforce: blog.read؛ ساخت/ویرایش/حذف: blog.write
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { requirePermission, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { getPendingCommentsCount } from "@/lib/blog/nav-counts";
import { BlogTabs } from "@/components/admin/blog/BlogTabs";
import { BlogPostsManager, type PostRow } from "@/components/admin/blog/BlogPostsManager";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const ctx = await requirePermission("blog.read");
  const canWrite = can(ctx, "blog.write");

  const [rows, pending] = await Promise.all([
    prisma.blogPost.findMany({
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
    }),
    getPendingCommentsCount(),
  ]);

  const posts: PostRow[] = rows.map((p) => ({
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
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-ink">بلاگ</h1>
          <p className="text-sm text-fog mt-0.5">نوشته‌ها، دسته‌ها و کامنت‌های همسو</p>
        </div>
        {canWrite && (
          <Link
            href="/admin/blog/posts/new"
            className="shrink-0 text-sm px-4 py-2 rounded-xl bg-ink text-paper hover:bg-charcoal transition-colors"
          >
            + مقالهٔ جدید
          </Link>
        )}
      </div>

      <BlogTabs active="posts" pendingComments={pending} />

      <BlogPostsManager posts={posts} canWrite={canWrite} />
    </div>
  );
}
