import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LandingEffects } from "@/components/features/landing/LandingEffects";
import { LandingNav } from "@/components/layout/LandingNav";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { PostCard } from "@/components/features/blog/PostCard";
import { ViewBeacon } from "@/components/features/blog/ViewBeacon";
import { LikeButton } from "@/components/features/blog/LikeButton";
import { ShareBar } from "@/components/features/blog/ShareBar";
import { ArticleToc } from "@/components/features/blog/ArticleToc";
import { ReadingProgress } from "@/components/features/blog/ReadingProgress";
import { CommentsSection, type CommentNode } from "@/components/features/blog/CommentsSection";
import {
  getPostBySlug,
  getRelatedPosts,
  getApprovedComments,
  type CommentView,
} from "@/lib/blog/queries";
import { renderMarkdown, extractHeadings } from "@/lib/blog/markdown";
import { formatJalali } from "@/lib/utils/date";
import { toFaDigits } from "@/lib/utils/digits";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getPostBySlug(slug);
  if (!post) return { title: "مقاله یافت نشد — همسو" };
  const title = post.metaTitle ?? `${post.title} — بلاگ همسو`;
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

/** شمارشِ کلِ کامنت‌های تأییدشده (ریشه + پاسخ‌ها). */
function countComments(nodes: CommentView[]): number {
  return nodes.reduce((sum, n) => sum + 1 + n.replies.length, 0);
}

/** تبدیلِ CommentView (با Date) به CommentNode سریال‌پذیر (با ISO). */
function toNode(c: CommentView): CommentNode {
  return {
    id: c.id,
    authorName: c.authorName,
    body: c.body,
    isAdminReply: c.isAdminReply,
    createdAtIso: c.createdAt.toISOString(),
    replies: c.replies.map(toNode),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [comments, related] = await Promise.all([
    getApprovedComments(post.id),
    getRelatedPosts(post.slug, post.categorySlug, 3),
  ]);

  const html = renderMarkdown(post.content);
  const headings = extractHeadings(post.content);
  const commentNodes = comments.map(toNode);
  const commentTotal = countComments(comments);

  return (
    <main className="grain">
      <LandingEffects />
      <ViewBeacon slug={post.slug} />
      {/* نوارِ نرمِ پیشرفتِ مطالعه — بالای صفحه */}
      <ReadingProgress targetId="article-body" />

      <div className="bg-stage" style={{ opacity: 0.45 }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <LandingNav />

      {/* HEADER */}
      <article>
        <header className="relative z-10 pt-28 pb-8 px-6 lg:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <div className="anim-fade-up d-1 mb-5 flex items-center gap-2 flex-wrap" style={{ fontWeight: 300, fontSize: "13px" }}>
                <Link href="/" className="text-fog hover:text-stone transition-colors">همسو</Link>
                <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
                <Link href="/blog" className="text-fog hover:text-stone transition-colors">بلاگ</Link>
                {post.categoryName && (
                  <>
                    <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
                    <Link href={`/blog?cat=${post.categorySlug}`} className="text-stone hover:text-sage-deep transition-colors">
                      {post.categoryName}
                    </Link>
                  </>
                )}
              </div>

              <h1
                className="anim-fade-up d-2"
                style={{ fontWeight: 200, fontSize: "clamp(26px, 3.6vw, 40px)", lineHeight: 1.3, letterSpacing: "-0.02em", color: "var(--color-ink)" }}
              >
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="anim-fade-up d-3 mt-4 text-stone" style={{ fontWeight: 300, fontSize: "16px", lineHeight: 1.8 }}>
                  {post.excerpt}
                </p>
              )}

              {/* متا */}
              <div className="anim-fade-up d-4 mt-5 flex items-center gap-3 text-sm text-fog flex-wrap" style={{ fontWeight: 300 }}>
                <span style={{ color: "var(--color-stone)" }}>{post.authorName}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                {post.publishedAt && <span className="fa-num">{formatJalali(new Date(post.publishedAt))}</span>}
                <span style={{ opacity: 0.4 }}>·</span>
                <span className="fa-num">{toFaDigits(post.readingMinutes)} دقیقه مطالعه</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span className="fa-num">{toFaDigits(post.viewCount)} بازدید</span>
              </div>
            </div>
          </div>
        </header>

        {/* بدنه: مقاله + سایدبارِ TOC */}
        <div className="relative z-10 px-6 lg:px-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-10 items-start">
            {/* ─── ستونِ مقاله ─── */}
            <div className="min-w-0" id="article-body">
              {/* کاور */}
              {post.coverImage && (
                <div className="reveal mb-10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full rounded-3xl"
                    style={{ boxShadow: "0 24px 64px rgba(46,44,40,0.14)" }}
                  />
                </div>
              )}

              <div
                className="prose-article max-w-2xl"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {/* برچسب‌ها */}
              {post.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap gap-2 max-w-2xl">
                  {post.tags.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/blog?tag=${encodeURIComponent(t.slug)}`}
                      className="text-xs rounded-full px-3 py-1.5 transition-all hover:-translate-y-px"
                      style={{ background: "rgba(var(--rgb-line),0.04)", color: "var(--color-stone)", fontWeight: 300, border: "1px solid rgba(var(--rgb-line),0.07)" }}
                    >
                      #{t.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* اکشن‌ها: لایک + اشتراک */}
              <div
                className="max-w-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 py-6 mt-8"
                style={{ borderTop: "1px solid rgba(var(--rgb-line),0.08)", borderBottom: "1px solid rgba(var(--rgb-line),0.08)" }}
              >
                <LikeButton slug={post.slug} initialCount={post.likeCount} />
                <ShareBar slug={post.slug} shortCode={post.shortCode} title={post.title} />
              </div>
            </div>

            {/* ─── سایدبار: فهرست مطالب چسبان ─── */}
            <aside className="hidden lg:block sticky top-24 self-start">
              <div className="glass rounded-2xl p-5 anim-fade-in d-4">
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

      {/* کامنت‌ها */}
      <CommentsSection slug={post.slug} comments={commentNodes} totalCount={commentTotal} />

      {/* مقالاتِ مرتبط */}
      {related.length > 0 && (
        <section className="relative z-10 px-6 lg:px-10 py-14" style={{ background: "rgba(var(--rgb-bone),0.28)" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="mb-7 text-center" style={{ fontWeight: 300, fontSize: "22px", letterSpacing: "-0.015em", color: "var(--color-ink)" }}>
              بیشتر بخوان
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((p) => (
                <div key={p.slug} className="reveal">
                  <PostCard post={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <LandingFooter />
    </main>
  );
}
