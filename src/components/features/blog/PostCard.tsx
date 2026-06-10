import Link from "next/link";
import { formatJalali } from "@/lib/utils/date";
import { toFaDigits } from "@/lib/utils/digits";
import type { PostCardView } from "@/lib/blog/queries";

// کارتِ مقاله در فهرستِ بلاگ — کاورِ گرادیانتیِ fallback، چیپِ دسته، متا.
export function PostCard({ post, featured = false }: { post: PostCardView; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group block rounded-3xl overflow-hidden hover-rise ${featured ? "md:flex" : ""}`}
      style={{
        background: "rgba(var(--rgb-card),0.5)",
        border: "1px solid rgba(var(--rgb-line),0.07)",
        boxShadow: "0 4px 24px rgba(46,44,40,0.05)",
      }}
    >
      {/* کاور */}
      <div
        className={`relative overflow-hidden ${featured ? "md:w-1/2 aspect-[16/10] md:aspect-auto" : "aspect-[16/10]"}`}
        style={{ background: "linear-gradient(135deg, rgba(122,132,113,0.18), rgba(155,180,199,0.16))" }}
      >
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: "44px", fontWeight: 100, color: "rgba(92,101,85,0.35)" }}>ه</span>
          </div>
        )}
        {post.categoryName && (
          <span
            className="absolute top-3 right-3 text-xs rounded-full px-2.5 py-1 backdrop-blur-sm"
            style={{ background: "rgba(var(--rgb-paper),0.85)", color: "var(--color-sage-deep)", fontWeight: 500 }}
          >
            {post.categoryName}
          </span>
        )}
      </div>

      {/* متن */}
      <div className={`p-6 ${featured ? "md:w-1/2 md:p-8 md:flex md:flex-col md:justify-center" : ""}`}>
        <h3
          className="transition-colors group-hover:text-sage-deep"
          style={{
            fontWeight: 400,
            fontSize: featured ? "clamp(22px, 3vw, 30px)" : "19px",
            lineHeight: 1.45,
            letterSpacing: "-0.01em",
            color: "var(--color-ink)",
          }}
        >
          {post.title}
        </h3>

        {post.excerpt && (
          <p
            className="mt-3 text-stone"
            style={{
              fontWeight: 300,
              fontSize: "14px",
              lineHeight: 1.8,
              display: "-webkit-box",
              WebkitLineClamp: featured ? 3 : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.excerpt}
          </p>
        )}

        {/* متا */}
        <div className="mt-5 flex items-center gap-3 text-xs text-fog flex-wrap" style={{ fontWeight: 300 }}>
          {post.publishedAt && (
            <span className="fa-num">{formatJalali(new Date(post.publishedAt))}</span>
          )}
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
      </div>
    </Link>
  );
}

function MetaIcon({ name }: { name: "eye" | "heart" | "chat" }) {
  const common = {
    width: 13,
    height: 13,
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
