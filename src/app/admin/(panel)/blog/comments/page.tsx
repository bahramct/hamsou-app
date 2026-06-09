// ─────────────────────────────────────────────────────────────────────────────
// /admin/blog/comments — صفِ مدیریتِ کامنت‌ها (DECISION-065) — enforce blog.moderate
// ایمیلِ کامنت‌گذار فقط اینجا دیده می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { getPendingCommentsCount } from "@/lib/blog/nav-counts";
import { BlogTabs } from "@/components/admin/blog/BlogTabs";
import { BlogCommentsManager, type AdminCommentRow } from "@/components/admin/blog/BlogCommentsManager";

export const dynamic = "force-dynamic";

export default async function AdminBlogCommentsPage() {
  await requirePermission("blog.moderate");

  const [rows, counts, pending] = await Promise.all([
    prisma.blogComment.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, authorName: true, authorEmail: true, body: true, status: true,
        isAdminReply: true, parentId: true, createdAt: true,
        post: { select: { title: true, slug: true } },
        parent: { select: { authorName: true, body: true } },
      },
    }),
    prisma.blogComment.groupBy({ by: ["status"], _count: { _all: true } }),
    getPendingCommentsCount(),
  ]);

  const countByStatus: Record<string, number> = {};
  for (const c of counts) countByStatus[c.status] = c._count._all;

  const initial: AdminCommentRow[] = rows.map((c) => ({
    id: c.id,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    body: c.body,
    status: c.status,
    isAdminReply: c.isAdminReply,
    parentId: c.parentId,
    createdAt: c.createdAt.toISOString(),
    postTitle: c.post.title,
    postSlug: c.post.slug,
    parentAuthor: c.parent?.authorName ?? null,
    parentExcerpt: c.parent ? c.parent.body.slice(0, 80) : null,
  }));

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink mb-5">بلاگ</h1>
      <BlogTabs active="comments" pendingComments={pending} />
      <BlogCommentsManager initialComments={initial} initialCounts={countByStatus} />
    </div>
  );
}
