"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PostsExplorer — فهرست مقالات بلاگ با دو چیدمان: کاشی (grid) و لیستی (list)
// انتخاب کاربر در localStorage می‌ماند تا دفعهٔ بعد همان چیدمان دیده شود.
// کارت‌ها عمداً جمع‌وجورتر از نسخهٔ قبل‌اند (بازخورد ری‌دیزاین بلاگ).
// داده‌ها از سرور serialize‌شده می‌آیند (تاریخ از قبل فرمت‌شده — fa-IR/جلالی).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { toFaDigits } from "@/lib/utils/digits";

export interface ExplorerPost {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  categoryName: string | null;
  dateLabel: string | null; // جلالی، از سرور
  readingMinutes: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isFeatured: boolean;
}

type Layout = "grid" | "list";
const LAYOUT_KEY = "hamsoo:blog:layout";

function readLayoutPref(): Layout {
  try {
    const v = localStorage.getItem(LAYOUT_KEY);
    return v === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

export function PostsExplorer({ posts }: { posts: ExplorerPost[] }) {
  const [layout, setLayout] = useState<Layout>("grid");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLayout(readLayoutPref());
    setMounted(true);
  }, []);

  function choose(l: Layout) {
    setLayout(l);
    try {
      localStorage.setItem(LAYOUT_KEY, l);
    } catch {
      // localStorage بسته — فقط برای همین بازدید اعمال می‌شود
    }
  }

  return (
    <div>
      {/* نوار بالای فهرست: سوییچ چیدمان */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-fog text-xs fa-num" style={{ fontWeight: 300 }}>
          {toFaDigits(posts.length)} نوشته
        </span>
        <div
          className="inline-flex items-center gap-0.5 rounded-xl p-1"
          style={{ background: "rgba(var(--rgb-line),0.05)", border: "1px solid rgba(var(--rgb-line),0.08)" }}
          role="group"
          aria-label="چیدمان فهرست"
        >
          <LayoutBtn active={layout === "grid"} onClick={() => choose("grid")} label="چیدمان کاشی">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
            </svg>
          </LayoutBtn>
          <LayoutBtn active={layout === "list"} onClick={() => choose("list")} label="چیدمان لیستی">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
              <path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.1" fill="currentColor" stroke="none" />
            </svg>
          </LayoutBtn>
        </div>
      </div>

      {/* تا خواندن ترجیح، با گرید رندر می‌شود؛ تغییر با گذار آرام */}
      <div style={{ opacity: mounted ? 1 : 0.999 }}>
        {layout === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {posts.map((p) => (
              <GridCard key={p.slug} post={p} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <ListRow key={p.slug} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
      style={
        active
          ? { background: "var(--color-ink)", color: "var(--color-paper)" }
          : { color: "var(--color-stone)" }
      }
    >
      {children}
    </button>
  );
}

// ─── کاور مشترک ───────────────────────────────────────────────────────────────
function Cover({ post, className }: { post: ExplorerPost; className: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: "linear-gradient(135deg, rgba(122,132,113,0.18), rgba(155,180,199,0.16))" }}
    >
      {post.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: "34px", fontWeight: 100, color: "rgba(92,101,85,0.35)" }}>ه</span>
        </div>
      )}
      {post.categoryName && (
        <span
          className="absolute top-2.5 right-2.5 text-[11px] rounded-full px-2 py-0.5 backdrop-blur-sm"
          style={{ background: "rgba(var(--rgb-paper),0.85)", color: "var(--color-sage-deep)", fontWeight: 500 }}
        >
          {post.categoryName}
        </span>
      )}
      {post.isFeatured && (
        <span
          className="absolute top-2.5 left-2.5 text-[11px] rounded-full px-2 py-0.5 backdrop-blur-sm"
          style={{ background: "rgba(var(--rgb-paper),0.85)", color: "var(--color-gold)", fontWeight: 500 }}
        >
          شاخص
        </span>
      )}
    </div>
  );
}

function Meta({ post }: { post: ExplorerPost }) {
  return (
    <div className="flex items-center gap-2.5 text-[11px] text-fog flex-wrap" style={{ fontWeight: 300 }}>
      {post.dateLabel && <span className="fa-num">{post.dateLabel}</span>}
      <span style={{ opacity: 0.4 }}>·</span>
      <span className="fa-num">{toFaDigits(post.readingMinutes)} دقیقه</span>
      <span className="flex items-center gap-1 fa-num mr-auto">
        <MetaIcon name="eye" />
        {toFaDigits(post.viewCount)}
      </span>
      <span className="flex items-center gap-1 fa-num">
        <MetaIcon name="heart" />
        {toFaDigits(post.likeCount)}
      </span>
      {post.commentCount > 0 && (
        <span className="flex items-center gap-1 fa-num">
          <MetaIcon name="chat" />
          {toFaDigits(post.commentCount)}
        </span>
      )}
    </div>
  );
}

// ─── کاشی (grid) — جمع‌وجور ───────────────────────────────────────────────────
function GridCard({ post }: { post: ExplorerPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-2xl overflow-hidden hover-rise"
      style={{
        background: "rgba(var(--rgb-card),0.5)",
        border: "1px solid rgba(var(--rgb-line),0.07)",
        boxShadow: "0 3px 18px rgba(46,44,40,0.045)",
      }}
    >
      <Cover post={post} className="aspect-[16/9]" />
      <div className="p-4">
        <h3
          className="transition-colors group-hover:text-sage-deep"
          style={{
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: 1.5,
            letterSpacing: "-0.01em",
            color: "var(--color-ink)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p
            className="mt-2 text-stone"
            style={{
              fontWeight: 300,
              fontSize: "13px",
              lineHeight: 1.75,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.excerpt}
          </p>
        )}
        <div className="mt-3.5">
          <Meta post={post} />
        </div>
      </div>
    </Link>
  );
}

// ─── لیستی (list) — سطرِ افقی با بندانگشتی ───────────────────────────────────
function ListRow({ post }: { post: ExplorerPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex gap-4 rounded-2xl overflow-hidden p-3 hover-rise"
      style={{
        background: "rgba(var(--rgb-card),0.5)",
        border: "1px solid rgba(var(--rgb-line),0.07)",
        boxShadow: "0 3px 18px rgba(46,44,40,0.045)",
      }}
    >
      <Cover post={post} className="w-36 sm:w-44 shrink-0 aspect-[16/11] rounded-xl" />
      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
        <h3
          className="transition-colors group-hover:text-sage-deep"
          style={{
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: 1.5,
            letterSpacing: "-0.01em",
            color: "var(--color-ink)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p
            className="mt-1.5 text-stone hidden sm:block"
            style={{
              fontWeight: 300,
              fontSize: "13px",
              lineHeight: 1.75,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.excerpt}
          </p>
        )}
        <div className="mt-2.5">
          <Meta post={post} />
        </div>
      </div>
    </Link>
  );
}

function MetaIcon({ name }: { name: "eye" | "heart" | "chat" }) {
  const common = {
    width: 12,
    height: 12,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "eye")
    return (
      <svg {...common}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  if (name === "heart")
    return (
      <svg {...common}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M21 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.4A8 8 0 1 1 21 11.5z" />
    </svg>
  );
}
