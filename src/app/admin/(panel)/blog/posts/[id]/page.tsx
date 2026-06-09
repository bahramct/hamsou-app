// ─────────────────────────────────────────────────────────────────────────────
// /admin/blog/posts/[id] — ویرایشِ مقاله (DECISION-065) — enforce blog.write
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { BlogPostEditor, type EditorCategory, type EditorInitial } from "@/components/admin/blog/BlogPostEditor";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: Props) {
  await requirePermission("blog.write");
  const { id } = await params;

  const [post, cats] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: { tags: { select: { tag: { select: { name: true } } } } },
    }),
    prisma.blogCategory.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  if (!post) notFound();

  const categories: EditorCategory[] = cats.map((c) => ({ id: c.id, name: c.name }));
  const initial: EditorInitial = {
    id: post.id,
    slug: post.slug,
    shortCode: post.shortCode,
    title: post.title,
    excerpt: post.excerpt ?? "",
    content: post.content,
    coverImage: post.coverImage,
    categoryId: post.categoryId,
    authorName: post.authorName,
    status: post.status,
    isFeatured: post.isFeatured,
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    tags: post.tags.map((t) => t.tag.name),
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-fog mb-5">
        <Link href="/admin/blog" className="hover:text-ink transition-colors">بلاگ</Link>
        <span style={{ opacity: 0.5 }}>›</span>
        <span className="text-stone truncate max-w-[40ch]">{post.title}</span>
      </div>

      <h1 className="text-xl font-semibold text-ink mb-5">ویرایشِ مقاله</h1>

      <BlogPostEditor mode="edit" categories={categories} initial={initial} />
    </div>
  );
}
