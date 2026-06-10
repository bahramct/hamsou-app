import Link from "next/link";
import { toFaDigits } from "@/lib/utils/digits";
import type { CategoryView, PostCardView, TagView } from "@/lib/blog/queries";

// ─────────────────────────────────────────────────────────────────────────────
// BlogSidebar — سایدبارِ بلاگ (ری‌دیزاین DECISION-068)
// کارت‌های شیشه‌ای: جستجو، دسته‌ها، محبوب‌ترین نوشته‌ها، ابرِ برچسب.
// Server Component — همهٔ داده‌ها از صفحه پاس می‌شوند.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  categories: CategoryView[];
  popular: PostCardView[];
  tags: TagView[];
  activeCat: string | null;
  activeTag: string | null;
  q: string | null;
}

function SideCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="glass rounded-2xl p-5 reveal"
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      <div
        className="text-fog text-[11px] uppercase tracking-[0.16em] mb-4"
        style={{ fontWeight: 600 }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function BlogSidebar({ categories, popular, tags, activeCat, activeTag, q }: Props) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-24 self-start">
      {/* جستجو */}
      <SideCard title="جستجو">
        <form action="/blog" method="GET" className="relative">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="در نوشته‌ها بگرد…"
            className="w-full rounded-xl py-2.5 pr-4 pl-11 text-sm text-ink outline-none transition-all"
            style={{
              background: "rgba(var(--rgb-card),0.55)",
              border: "1px solid rgba(var(--rgb-line),0.10)",
              fontWeight: 300,
            }}
          />
          <button
            type="submit"
            aria-label="جستجو"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-stone hover:text-ink hover:bg-black/5 transition-all"
          >
            <SearchIcon />
          </button>
        </form>
      </SideCard>

      {/* دسته‌ها */}
      {categories.length > 0 && (
        <SideCard title="دسته‌ها" delay={60}>
          <ul className="space-y-1">
            <li>
              <Link
                href="/blog"
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-all hover:bg-black/4"
                style={{
                  fontWeight: !activeCat && !activeTag ? 500 : 300,
                  color: !activeCat && !activeTag ? "var(--color-sage-deep)" : "var(--color-stone)",
                }}
              >
                همهٔ نوشته‌ها
              </Link>
            </li>
            {categories.map((c) => {
              const active = activeCat === c.slug;
              return (
                <li key={c.slug}>
                  <Link
                    href={`/blog?cat=${encodeURIComponent(c.slug)}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-all hover:bg-black/4"
                    style={{
                      fontWeight: active ? 500 : 300,
                      color: active ? "var(--color-sage-deep)" : "var(--color-stone)",
                      background: active ? "rgba(122,132,113,0.08)" : undefined,
                    }}
                  >
                    <span>{c.name}</span>
                    <span className="fa-num text-xs" style={{ opacity: 0.55 }}>
                      {toFaDigits(c.count)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </SideCard>
      )}

      {/* محبوب‌ترین نوشته‌ها */}
      {popular.length > 0 && (
        <SideCard title="خواندنی‌ترین‌ها" delay={120}>
          <ul className="space-y-4">
            {popular.map((p, i) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group flex items-start gap-3">
                  <span
                    className="fa-num shrink-0 leading-none"
                    style={{ fontWeight: 100, fontSize: "26px", color: "var(--color-fog)", marginTop: "2px" }}
                  >
                    {toFaDigits(i + 1)}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block text-sm transition-colors group-hover:text-sage-deep"
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
                    <span className="block mt-1 text-xs text-fog fa-num" style={{ fontWeight: 300 }}>
                      {toFaDigits(p.readingMinutes)} دقیقه مطالعه
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SideCard>
      )}

      {/* ابرِ برچسب */}
      {tags.length > 0 && (
        <SideCard title="برچسب‌ها" delay={180}>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => {
              const active = activeTag === t.slug;
              return (
                <Link
                  key={t.slug}
                  href={active ? "/blog" : `/blog?tag=${encodeURIComponent(t.slug)}`}
                  className="text-xs rounded-full px-3 py-1.5 transition-all hover:-translate-y-px"
                  style={
                    active
                      ? { background: "var(--color-sage)", color: "var(--color-paper)", fontWeight: 500 }
                      : {
                          background: "rgba(var(--rgb-line),0.04)",
                          color: "var(--color-stone)",
                          fontWeight: 300,
                          border: "1px solid rgba(var(--rgb-line),0.08)",
                        }
                  }
                >
                  #{t.name}
                </Link>
              );
            })}
          </div>
        </SideCard>
      )}
    </aside>
  );
}
