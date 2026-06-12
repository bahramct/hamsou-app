import Link from "next/link";
import { toFaDigits } from "@/lib/utils/digits";
import type { PostCardView } from "@/lib/blog/queries";

// کارتِ فشردهٔ «بیشتر بخوان» — فقط در پایانِ مقاله. PostCard موجود دست نمی‌خورد.
export function RelatedPostCard({ post }: { post: PostCardView }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden hover-rise"
      style={{
        background: "rgba(var(--rgb-card),0.55)",
        border: "1px solid rgba(var(--rgb-line),0.07)",
      }}
    >
      {/* تصویر */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "16/9",
          background: "linear-gradient(135deg, rgba(122,132,113,0.18), rgba(155,180,199,0.16))",
        }}
      >
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: "32px", fontWeight: 100, color: "rgba(92,101,85,0.3)" }}>ه</span>
          </div>
        )}

        {/* chip دسته */}
        {post.categoryName && (
          <span
            className="absolute top-2.5 right-2.5 text-[11px] rounded-full px-2.5 py-0.5 backdrop-blur-sm"
            style={{
              background: "rgba(var(--rgb-paper),0.88)",
              color: "var(--color-sage-deep)",
              fontWeight: 500,
            }}
          >
            {post.categoryName}
          </span>
        )}
      </div>

      {/* محتوا */}
      <div className="flex flex-col gap-2.5 p-4">
        <h3
          className="transition-colors group-hover:text-sage-deep"
          style={{
            fontWeight: 400,
            fontSize: "15px",
            lineHeight: 1.55,
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

        {/* زمان مطالعه */}
        <span
          className="fa-num"
          style={{ fontSize: "12px", fontWeight: 300, color: "var(--color-fog)" }}
        >
          {toFaDigits(post.readingMinutes)} دقیقه مطالعه
        </span>
      </div>
    </Link>
  );
}
