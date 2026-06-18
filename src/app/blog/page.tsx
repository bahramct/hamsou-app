import type { Metadata } from "next";
import Link from "next/link";
import { LandingEffects } from "@/components/features/landing/LandingEffects";
import { LandingNavServer } from "@/components/layout/LandingNavServer";
import { PublicPageTracker } from "@/components/system/PublicPageTracker";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { PostsExplorer, type ExplorerPost } from "@/components/features/blog/PostsExplorer";
import { BlogSidebar } from "@/components/features/blog/BlogSidebar";
import {
  getPublishedPosts,
  getFeaturedPost,
  getCategoriesWithCount,
  getPopularPosts,
  getPopularTags,
  type PostCardView,
} from "@/lib/blog/queries";
import { formatJalali } from "@/lib/utils/date";
import { toFaDigits } from "@/lib/utils/digits";

export const metadata: Metadata = {
  title: "بلاگ همسو — یادداشت‌هایی دربارهٔ عمل، خودآگاهی و مسیر",
  description:
    "نوشته‌هایی آرام دربارهٔ فاصلهٔ میان حرف و عمل، خودآگاهی، و زیستنِ نزدیک‌تر به آنچه می‌گوییم.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ page?: string; cat?: string; tag?: string; q?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const cat = sp.cat ?? null;
  const tag = sp.tag ?? null;
  const q = sp.q?.trim() || null;
  const filtered = Boolean(cat || tag || q);

  const [{ posts, pageCount, total }, categories, popular, tags, featured] = await Promise.all([
    getPublishedPosts({ page, categorySlug: cat, tagSlug: tag, q }),
    getCategoriesWithCount(),
    getPopularPosts(4),
    getPopularTags(12),
    page === 1 && !filtered ? getFeaturedPost() : Promise.resolve(null),
  ]);

  // مقالهٔ شاخص اولِ فهرست می‌آید (با نشانِ «شاخص») — بدون کارتِ تمام‌عرضِ بزرگ
  const ordered = featured
    ? [featured, ...posts.filter((p) => p.slug !== featured.slug)]
    : posts;

  // serialize برای کامپوننتِ کلاینت (تاریخ از همین‌جا جلالی می‌شود)
  const explorerPosts: ExplorerPost[] = ordered.map((p: PostCardView) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    categoryName: p.categoryName,
    dateLabel: p.publishedAt ? formatJalali(new Date(p.publishedAt)) : null,
    readingMinutes: p.readingMinutes,
    viewCount: p.viewCount,
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    isFeatured: Boolean(featured && p.slug === featured.slug),
  }));

  // ساختِ querystring صفحه‌بندی با حفظِ فیلترهای فعال
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (cat) params.set("cat", cat);
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
    if (n > 1) params.set("page", String(n));
    const s = params.toString();
    return s ? `/blog?${s}` : "/blog";
  };

  const activeCatName = cat ? categories.find((c) => c.slug === cat)?.name ?? cat : null;
  const activeTagName = tag ? tags.find((t) => t.slug === tag)?.name ?? tag : null;

  return (
    <main className="grain">
      <LandingEffects />

      <div className="bg-stage" style={{ opacity: 0.5 }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <PublicPageTracker />
      <LandingNavServer returnPath="/blog" />

      {/* HERO — جمع‌وجور */}
      <section className="relative z-10 pt-28 pb-10 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="anim-fade-up d-1 mb-5 flex items-center gap-2" style={{ fontWeight: 300, fontSize: "13px" }}>
            <Link href="/" className="text-fog hover:text-stone transition-colors">همسو</Link>
            <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
            <span className="text-stone">بلاگ</span>
          </div>

          <h1
            className="anim-fade-up d-2"
            style={{ fontWeight: 100, fontSize: "clamp(28px, 3.8vw, 44px)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--color-ink)" }}
          >
            یادداشت‌هایی برای{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>
              نزدیک‌تر زیستن
            </em>
          </h1>

          <p className="anim-fade-up d-3 mt-3 text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.8 }}>
            دربارهٔ فاصلهٔ میان حرف و عمل، خودآگاهی، و مسیر.
          </p>
        </div>
      </section>

      {/* محتوا: ستونِ اصلی + سایدبار */}
      <section className="relative z-10 px-6 lg:px-10 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_290px] gap-8 lg:gap-10 items-start">
          {/* ─── ستونِ اصلی ─── */}
          <div className="min-w-0">
            {/* وضعیتِ فیلتر/جستجو */}
            {filtered && (
              <div
                className="anim-fade-in mb-6 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: "rgba(var(--rgb-card),0.45)", border: "1px solid rgba(var(--rgb-line),0.08)" }}
              >
                <span className="text-sm text-stone" style={{ fontWeight: 300 }}>
                  {q && <>نتایج برای «<span style={{ fontWeight: 500, color: "var(--color-ink)" }}>{q}</span>»</>}
                  {activeCatName && <>دستهٔ «<span style={{ fontWeight: 500, color: "var(--color-ink)" }}>{activeCatName}</span>»</>}
                  {activeTagName && <>برچسبِ «<span style={{ fontWeight: 500, color: "var(--color-ink)" }}>#{activeTagName}</span>»</>}
                  <span className="fa-num mr-2" style={{ opacity: 0.6 }}>({toFaDigits(total)} نوشته)</span>
                </span>
                <Link
                  href="/blog"
                  className="mr-auto text-xs rounded-full px-3 py-1.5 text-stone hover:text-ink transition-colors"
                  style={{ background: "rgba(var(--rgb-line),0.05)", border: "1px solid rgba(var(--rgb-line),0.08)", fontWeight: 400 }}
                >
                  پاک کردن ✕
                </Link>
              </div>
            )}

            {posts.length === 0 ? (
              <div
                className="text-center py-20 rounded-3xl"
                style={{ background: "rgba(var(--rgb-card),0.35)", border: "1px solid rgba(var(--rgb-line),0.07)" }}
              >
                <p className="text-fog" style={{ fontWeight: 300, fontSize: "16px" }}>
                  {q ? "چیزی با این جستجو پیدا نشد." : "هنوز نوشته‌ای اینجا نیست."}
                </p>
              </div>
            ) : (
              <>
                {/* فهرست با چیدمانِ انتخابیِ کاربر (کاشی/لیستی — ذخیره در دستگاه) */}
                <PostsExplorer posts={explorerPosts} />

                {/* صفحه‌بندی */}
                {pageCount > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
                      const isActive = n === page;
                      return (
                        <Link
                          key={n}
                          href={pageHref(n)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm fa-num transition-all"
                          style={
                            isActive
                              ? { background: "var(--color-ink)", color: "var(--color-paper)", fontWeight: 500 }
                              : { background: "rgba(var(--rgb-line),0.04)", color: "var(--color-stone)", fontWeight: 300, border: "1px solid rgba(var(--rgb-line),0.08)" }
                          }
                        >
                          {toFaDigits(n)}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ─── سایدبار ─── */}
          <BlogSidebar
            categories={categories}
            popular={popular}
            tags={tags}
            activeCat={cat}
            activeTag={tag}
            q={q}
          />
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
