// ─────────────────────────────────────────────────────────────────────────────
// /admin/blog/preview/[slug] — پیش‌نمایشِ مقاله (هر وضعیتی) برای ادمین
// صفحه عمومی /blog/[slug] فقط published می‌بیند؛ این صفحه بدون فیلتر status.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin/auth-server";
import { getPostBySlugAdmin } from "@/lib/blog/queries";
import { renderMarkdown, extractHeadings } from "@/lib/blog/markdown";
import { formatJalali } from "@/lib/utils/date";
import { toFaDigits } from "@/lib/utils/digits";
import { LandingNav } from "@/components/layout/LandingNav";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { ArticleToc } from "@/components/features/blog/ArticleToc";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminBlogPreviewPage({ params }: Props) {
  await requirePermission("blog.write");
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getPostBySlugAdmin(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.content);
  const headings = extractHeadings(post.content);

  const isDraft = !post.publishedAt;

  return (
    <main className="grain min-h-screen" style={{ background: "var(--color-paper)" }}>
      {/* نوارِ پیش‌نمایشِ ادمین */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-2.5 text-sm"
        style={{
          background: "rgba(199,93,60,0.92)",
          backdropFilter: "blur(8px)",
          color: "#fff",
        }}
      >
        <span style={{ fontWeight: 500 }}>
          {isDraft ? "پیش‌نمایشِ پیش‌نویس — این مقاله هنوز منتشر نشده" : "پیش‌نمایشِ مقاله"}
        </span>
        <Link
          href={`/admin/blog/posts/${post.id}`}
          className="underline underline-offset-2 hover:no-underline text-white/90"
        >
          بازگشت به ویرایش
        </Link>
      </div>

      <LandingNav />

      <article>
        <header className="relative z-10 pt-24 pb-8 px-6 lg:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <div className="mb-5 flex items-center gap-2 flex-wrap" style={{ fontWeight: 300, fontSize: "13px" }}>
                <span className="text-fog">همسو</span>
                <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
                <span className="text-fog">بلاگ</span>
                {post.categoryName && (
                  <>
                    <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
                    <span className="text-stone">{post.categoryName}</span>
                  </>
                )}
              </div>

              <h1
                style={{
                  fontWeight: 200,
                  fontSize: "clamp(26px, 3.6vw, 40px)",
                  lineHeight: 1.3,
                  letterSpacing: "-0.02em",
                  color: "var(--color-ink)",
                }}
              >
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="mt-4 text-stone" style={{ fontWeight: 300, fontSize: "16px", lineHeight: 1.8 }}>
                  {post.excerpt}
                </p>
              )}

              <div className="mt-5 flex items-center gap-3 text-sm text-fog flex-wrap" style={{ fontWeight: 300 }}>
                <span style={{ color: "var(--color-stone)" }}>{post.authorName}</span>
                {post.publishedAt && (
                  <>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span className="fa-num">{formatJalali(new Date(post.publishedAt))}</span>
                  </>
                )}
                <span style={{ opacity: 0.4 }}>·</span>
                <span className="fa-num">{toFaDigits(post.readingMinutes)} دقیقه مطالعه</span>
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 px-6 lg:px-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-10 items-start">
            <div className="min-w-0" id="article-body">
              {post.coverImage && (
                <div className="mb-10 max-w-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full rounded-2xl object-cover"
                    style={{ maxHeight: "380px", boxShadow: "0 16px 44px rgba(46,44,40,0.12)" }}
                  />
                </div>
              )}

              <div
                className="prose-article max-w-2xl"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {post.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap gap-2 max-w-2xl">
                  {post.tags.map((t) => (
                    <span
                      key={t.slug}
                      className="text-xs rounded-full px-3 py-1.5"
                      style={{
                        background: "rgba(var(--rgb-line),0.04)",
                        color: "var(--color-stone)",
                        fontWeight: 300,
                        border: "1px solid rgba(var(--rgb-line),0.07)",
                      }}
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <aside className="hidden lg:block sticky top-24 self-start space-y-5">
              <div className="glass rounded-2xl p-5">
                <ArticleToc headings={headings} />
                {headings.length < 2 && (
                  <p className="text-fog text-[13px]" style={{ fontWeight: 300, lineHeight: 1.8 }}>
                    نوشته‌ای کوتاه — یک‌نفس بخوان.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </article>

      <LandingFooter />
    </main>
  );
}
