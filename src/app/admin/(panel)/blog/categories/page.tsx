// ─────────────────────────────────────────────────────────────────────────────
// /admin/blog/categories — مدیریتِ دسته‌ها و برچسب‌ها (DECISION-065)
// enforce: blog.read؛ تغییر: blog.write
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { getPendingCommentsCount } from "@/lib/blog/nav-counts";
import { BlogTabs } from "@/components/admin/blog/BlogTabs";
import {
  BlogTaxonomyManager,
  type CategoryRow,
  type TagRow,
} from "@/components/admin/blog/BlogTaxonomyManager";

export const dynamic = "force-dynamic";

export default async function AdminBlogCategoriesPage() {
  const ctx = await requirePermission("blog.read");
  const canWrite = can(ctx, "blog.write");

  const [cats, tags, pending] = await Promise.all([
    prisma.blogCategory.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, slug: true, name: true, description: true, order: true, isActive: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.blogTag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, _count: { select: { posts: true } } },
    }),
    getPendingCommentsCount(),
  ]);

  const categories: CategoryRow[] = cats.map((c) => ({
    id: c.id, slug: c.slug, name: c.name, description: c.description,
    order: c.order, isActive: c.isActive, postCount: c._count.posts,
  }));
  const tagRows: TagRow[] = tags.map((t) => ({ id: t.id, slug: t.slug, name: t.name, postCount: t._count.posts }));

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink mb-5">بلاگ</h1>
      <BlogTabs active="taxonomy" pendingComments={pending} />
      <BlogTaxonomyManager categories={categories} tags={tagRows} canWrite={canWrite} />
    </div>
  );
}
