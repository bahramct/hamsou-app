import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LandingEffects } from "@/components/features/landing/LandingEffects";
import { LandingNavServer } from "@/components/layout/LandingNavServer";
import { PublicPageTracker } from "@/components/system/PublicPageTracker";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { RelatedPostCard } from "@/components/features/blog/RelatedPostCard";
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
  getPopularPosts,
  getPopularTags,
  type CommentView,
} from "@/lib/blog/queries";
import { renderMarkdown, extractHeadings } from "@/lib/blog/markdown";
import { formatJalali } from "@/lib/utils/date";
import { toFaDigits } from "@/lib/utils/digits";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";

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

/** کاربرِ عضوِ لاگین‌کرده (یا null). فقط نامِ نمایشی لازم است (DECISION-079). */
async function getCommentAuthor(): Promise<{ name: string } | null> {
  const session = await getSessionUser();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { displayName: true },
  });
  if (!user) return null;
  return { name: user.displayName?.trim() || "عضو همسو" };
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

  const [comments, related, popular, tags, currentUser] = await Promise.all([
    getApprovedComments(post.id),
    getRelatedPosts(post.slug, post.categorySlug, 3),
    getPopularPosts(4),
    getPopularTags(10),
    getCommentAuthor(),
  ]);

  // «خواندنی‌ترین‌ها» بدونِ خودِ مقاله
  const sidebarPopular = popular.filter((p) => p.slug !== post.slug).slice(0, 3);

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

      <PublicPageTracker />
      <LandingNavServer returnPath={`/blog/${slug}`} />

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
              {/* کاور — هم‌عرضِ متن، با سقفِ ارتفاع (نه تمام‌قد) */}
              {post.coverImage && (
                <div className="reveal mb-10 max-w-2xl">
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

              {/* کامنت‌ها — هم‌عرض و هم‌راستا با متنِ مقاله (راست‌چین) */}
              <CommentsSection
                slug={post.slug}
                comments={commentNodes}
                totalCount={commentTotal}
                currentUser={currentUser}
              />
            </div>

            {/* ─── سایدبار: فهرست مطالب + خواندنی‌ترین‌ها + برچسب‌ها ─── */}
            <aside className="hidden lg:block sticky top-24 self-start space-y-5">
              <div className="glass rounded-2xl p-5 anim-fade-in d-4">
                <ArticleToc headings={headings} />
                {headings.length < 2 && (
                  <p className="text-fog text-[13px]" style={{ fontWeight: 300, lineHeight: 1.8 }}>
                    نوشته‌ای کوتاه — یک‌نفس بخوان.
                  </p>
                )}
              </div>

              {/* خواندنی‌ترین‌ها */}
              {sidebarPopular.length > 0 && (
                <div className="glass rounded-2xl p-5 anim-fade-in d-5">
                  <div className="text-fog text-[11px] uppercase tracking-[0.16em] mb-4" style={{ fontWeight: 600 }}>
                    خواندنی‌ترین‌ها
                  </div>
                  <ul className="space-y-3.5">
                    {sidebarPopular.map((p, i) => (
                      <li key={p.slug}>
                        <Link href={`/blog/${p.slug}`} className="group flex items-start gap-3">
                          <span
                            className="fa-num shrink-0 leading-none"
                            style={{ fontWeight: 100, fontSize: "22px", color: "var(--color-fog)", marginTop: "2px" }}
                          >
                            {toFaDigits(i + 1)}
                          </span>
                          <span className="min-w-0">
                            <span
                              className="block text-[13px] transition-colors group-hover:text-sage-deep"
                              style={{
                                fontWeight: 400,
                                color: "var(--color-ink)",
                                lineHeight: 1.6,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {p.title}
                            </span>
                            <span className="block mt-0.5 text-[11px] text-fog fa-num" style={{ fontWeight: 300 }}>
                              {toFaDigits(p.readingMinutes)} دقیقه مطالعه
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* برچسب‌ها */}
              {tags.length > 0 && (
                <div className="glass rounded-2xl p-5 anim-fade-in d-6">
                  <div className="text-fog text-[11px] uppercase tracking-[0.16em] mb-3.5" style={{ fontWeight: 600 }}>
                    برچسب‌ها
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <Link
                        key={t.slug}
                        href={`/blog?tag=${encodeURIComponent(t.slug)}`}
                        className="text-xs rounded-full px-2.5 py-1 transition-all hover:-translate-y-px"
                        style={{
                          background: "rgba(var(--rgb-line),0.04)",
                          color: "var(--color-stone)",
                          fontWeight: 300,
                          border: "1px solid rgba(var(--rgb-line),0.08)",
                        }}
                      >
                        #{t.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* دربارهٔ بلاگ */}
              <div className="glass rounded-2xl p-5 anim-fade-in d-6">
                <div className="text-fog text-[11px] uppercase tracking-[0.16em] mb-3" style={{ fontWeight: 600 }}>
                  بلاگ همسو
                </div>
                <p className="text-stone text-[13px] mb-3" style={{ fontWeight: 300, lineHeight: 1.9 }}>
                  یادداشت‌هایی آرام دربارهٔ فاصلهٔ میان حرف و عمل، خودآگاهی، و مسیر.
                </p>
                <Link
                  href="/blog"
                  className="text-[13px] transition-colors hover:text-sage-deep"
                  style={{ color: "var(--color-sage-deep)", fontWeight: 400 }}
                >
                  همهٔ نوشته‌ها ←
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* مقالاتِ مرتبط */}
      {related.length > 0 && (
        <section className="relative z-10 px-6 lg:px-10 py-12">
          <div className="max-w-6xl mx-auto">
            {/* عنوان بخش */}
            <div className="flex items-center gap-4 mb-7 max-w-2xl">
              <span
                className="text-fog"
                style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}
              >
                بیشتر بخوان
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(var(--rgb-line),0.12)" }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((p) => (
                <div key={p.slug} className="reveal">
                  <RelatedPostCard post={p} />
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
