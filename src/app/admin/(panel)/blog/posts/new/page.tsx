// ─────────────────────────────────────────────────────────────────────────────
// /admin/blog/posts/new — ساختِ مقالهٔ جدید (DECISION-065) — enforce blog.write
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { BlogPostEditor, type EditorCategory } from "@/components/admin/blog/BlogPostEditor";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  await requirePermission("blog.write");

  const cats = await prisma.blogCategory.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true },
  });
  const categories: EditorCategory[] = cats.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-fog mb-5">
        <Link href="/admin/blog" className="hover:text-ink transition-colors">بلاگ</Link>
        <span style={{ opacity: 0.5 }}>›</span>
        <span className="text-stone">مقالهٔ جدید</span>
      </div>

      <h1 className="text-xl font-semibold text-ink mb-5">مقالهٔ جدید</h1>

      <BlogPostEditor mode="create" categories={categories} />
    </div>
  );
}
