import type { Metadata } from "next";
import Link from "next/link";
import { LandingEffects } from "@/components/features/landing/LandingEffects";
import { LandingNav } from "@/components/layout/LandingNav";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { PostCard } from "@/components/features/blog/PostCard";
import {
  getPublishedPosts,
  getFeaturedPost,
  getCategoriesWithCount,
} from "@/lib/blog/queries";
import { toFaDigits } from "@/lib/utils/digits";

export const metadata: Metadata = {
  title: "بلاگ همسو — یادداشت‌هایی دربارهٔ عمل، خودآگاهی و مسیر",
  description:
    "نوشته‌هایی آرام دربارهٔ فاصلهٔ میان حرف و عمل، خودآگاهی، و زیستنِ نزدیک‌تر به آنچه می‌گوییم.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ page?: string; cat?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const cat = sp.cat ?? null;

  const [{ posts, pageCount }, categories, featured] = await Promise.all([
    getPublishedPosts({ page, categorySlug: cat }),
    getCategoriesWithCount(),
    page === 1 && !cat ? getFeaturedPost() : Promise.resolve(null),
  ]);

  // مقالهٔ شاخص از گریدِ صفحهٔ اول حذف می‌شود تا تکراری نباشد
  const gridPosts = featured ? posts.filter((p) => p.slug !== featured.slug) : posts;

  return (
    <main className="grain">
      <LandingEffects />

      <div className="bg-stage" style={{ opacity: 0.5 }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <LandingNav />

      {/* HERO */}
      <section className="relative z-10 pt-36 pb-12 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="anim-fade-up d-1 mb-6 flex items-center justify-center gap-2" style={{ fontWeight: 300, fontSize: "14px" }}>
            <Link href="/" className="text-fog hover:text-stone transition-colors">همسو</Link>
            <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
            <span className="text-stone">بلاگ</span>
          </div>

          <div className="anim-fade-up d-2 mb-6 flex justify-center">
            <span className="pill"><span className="pill-dot" />نوشته‌ها</span>
          </div>

          <h1
            className="anim-fade-up d-3"
            style={{ fontWeight: 100, fontSize: "clamp(38px, 5.5vw, 68px)", lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--color-ink)" }}
          >
            یادداشت‌هایی برای{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>
              نزدیک‌تر زیستن
            </em>
          </h1>

          <p className="anim-fade-up d-4 mt-5 text-stone" style={{ fontWeight: 300, fontSize: "17px", lineHeight: 1.8 }}>
            دربارهٔ فاصلهٔ میان حرف و عمل، خودآگاهی، و مسیر.
          </p>
        </div>
      </section>

      {/* فیلترِ دسته */}
      {categories.length > 0 && (
        <section className="relative z-10 px-6 lg:px-10 pb-10">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2.5">
            <CategoryChip label="همه" href="/blog" active={!cat} />
            {categories.map((c) => (
              <CategoryChip
                key={c.slug}
                label={`${c.name}`}
                count={c.count}
                href={`/blog?cat=${encodeURIComponent(c.slug)}`}
                active={cat === c.slug}
              />
            ))}
          </div>
        </section>
      )}

      {/* محتوا */}
      <section className="relative z-10 px-6 lg:px-10 pb-20">
        <div className="max-w-5xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-fog" style={{ fontWeight: 300, fontSize: "17px" }}>
                هنوز نوشته‌ای اینجا نیست.
              </p>
            </div>
          ) : (
            <>
              {/* شاخص */}
              {featured && (
                <div className="reveal mb-8">
                  <PostCard post={featured} featured />
                </div>
              )}

              {/* گرید */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridPosts.map((p) => (
                  <div key={p.slug} className="reveal">
                    <PostCard post={p} />
                  </div>
                ))}
              </div>

              {/* صفحه‌بندی */}
              {pageCount > 1 && (
                <div className="mt-14 flex items-center justify-center gap-2">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
                    const href = `/blog?${cat ? `cat=${encodeURIComponent(cat)}&` : ""}page=${n}`;
                    const isActive = n === page;
                    return (
                      <Link
                        key={n}
                        href={href}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm fa-num transition-all"
                        style={
                          isActive
                            ? { background: "var(--color-ink)", color: "var(--color-paper)", fontWeight: 500 }
                            : { background: "rgba(26,26,31,0.04)", color: "var(--color-stone)", fontWeight: 300, border: "1px solid rgba(26,26,31,0.08)" }
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
      </section>

      <LandingFooter />
    </main>
  );
}

function CategoryChip({ label, href, active, count }: { label: string; href: string; active: boolean; count?: number }) {
  return (
    <Link
      href={href}
      className="text-sm rounded-full px-4 py-2 transition-all"
      style={
        active
          ? { background: "var(--color-sage)", color: "var(--color-paper)", fontWeight: 500 }
          : { background: "rgba(255,255,255,0.55)", color: "var(--color-stone)", fontWeight: 300, border: "1px solid rgba(26,26,31,0.08)" }
      }
    >
      {label}
      {typeof count === "number" && count > 0 && (
        <span className="fa-num mr-1.5" style={{ opacity: active ? 0.8 : 0.5, fontSize: "11px" }}>
          {toFaDigits(count)}
        </span>
      )}
    </Link>
  );
}
