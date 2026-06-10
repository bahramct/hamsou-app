"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ArticleToc — فهرست مطالبِ چسبانِ مقاله (ری‌دیزاین بلاگ، DECISION-068)
// سرفصل‌های h2/h3 با scroll-spy (IntersectionObserver) — بخشِ فعال هایلایت
// می‌شود. کلیک = اسکرولِ نرم (scroll-behavior: smooth از html).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type { ArticleHeading } from "@/lib/blog/markdown";

export function ArticleToc({ headings }: { headings: ArticleHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // بالاترین سرفصلِ قابل‌مشاهده در ناحیهٔ خواندن، فعال است
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="فهرست مطالب">
      <div
        className="text-fog text-[11px] uppercase tracking-[0.16em] mb-4"
        style={{ fontWeight: 600 }}
      >
        در این نوشته
      </div>
      <ul className="space-y-0.5">
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className="block rounded-lg py-1.5 text-[13px] leading-relaxed transition-all duration-300"
                style={{
                  paddingRight: h.level === 3 ? "1.6rem" : "0.75rem",
                  paddingLeft: "0.5rem",
                  fontWeight: active ? 500 : 300,
                  color: active ? "var(--color-sage-deep)" : "var(--color-stone)",
                  borderRight: active
                    ? "2px solid var(--color-sage)"
                    : "2px solid transparent",
                  background: active ? "rgba(122,132,113,0.07)" : undefined,
                }}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
