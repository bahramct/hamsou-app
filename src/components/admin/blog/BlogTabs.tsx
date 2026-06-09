import Link from "next/link";
import { toFaDigits } from "@/lib/utils/digits";

// تب‌های زیربخشِ بلاگ در پنل (مقالات / دسته‌ها و برچسب‌ها / کامنت‌ها).
type Tab = "posts" | "taxonomy" | "comments";

export function BlogTabs({ active, pendingComments = 0 }: { active: Tab; pendingComments?: number }) {
  const tabs: { key: Tab; label: string; href: string; badge?: number }[] = [
    { key: "posts", label: "مقالات", href: "/admin/blog" },
    { key: "taxonomy", label: "دسته‌ها و برچسب‌ها", href: "/admin/blog/categories" },
    { key: "comments", label: "کامنت‌ها", href: "/admin/blog/comments", badge: pendingComments },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-black/8 mb-6 overflow-x-auto">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`relative px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
              isActive ? "text-ink font-medium" : "text-stone hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {t.label}
              {t.badge ? (
                <span className="min-w-4 h-4 px-1 rounded-full bg-ember text-paper text-[9px] font-bold flex items-center justify-center fa-num">
                  {toFaDigits(t.badge)}
                </span>
              ) : null}
            </span>
            {isActive && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-ink rounded-full" />}
          </Link>
        );
      })}
    </div>
  );
}
