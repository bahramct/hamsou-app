"use client";

import { useEffect, useState } from "react";
import { toFaDigits } from "@/lib/utils/digits";

// دکمهٔ لایک — toggleِ حالت (استثنای مجازِ DECISION-053: بازتابِ وضعیت، نه پیشرفت).
// قلب پر/خالی + شمارنده. fingerprint سمتِ سرور؛ اینجا فقط حالت را sync می‌کنیم.
export function LikeButton({
  slug,
  initialCount,
}: {
  slug: string;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  // وضعیتِ اولیهٔ لایکِ این بازدیدکننده
  useEffect(() => {
    fetch(`/api/blog/${encodeURIComponent(slug)}/like`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setLiked(Boolean(d.liked));
          setCount(d.likeCount ?? initialCount);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    // optimistic
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setCount((c) => c + (optimisticLiked ? 1 : -1));
    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}/like`, { method: "POST" });
      const d = await res.json();
      if (d?.ok) {
        setLiked(Boolean(d.liked));
        setCount(d.likeCount ?? 0);
      } else {
        // برگشت در صورت خطا
        setLiked(liked);
        setCount((c) => c + (optimisticLiked ? -1 : 1));
      }
    } catch {
      setLiked(liked);
      setCount((c) => c + (optimisticLiked ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={liked}
      title={liked ? "برداشتن لایک" : "لایک"}
      className="inline-flex items-center gap-2 rounded-full transition-all"
      style={{
        padding: "0.5rem 1rem",
        background: liked ? "rgba(199,93,60,0.08)" : "rgba(var(--rgb-line),0.04)",
        border: `1px solid ${liked ? "rgba(199,93,60,0.25)" : "rgba(var(--rgb-line),0.08)"}`,
        color: liked ? "var(--color-ember)" : "var(--color-stone)",
      }}
    >
      <svg
        width="18" height="18" viewBox="0 0 24 24"
        fill={liked ? "var(--color-ember)" : "none"}
        stroke={liked ? "var(--color-ember)" : "currentColor"}
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: "all .25s", transform: liked ? "scale(1.05)" : "scale(1)" }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="fa-num text-sm" style={{ fontWeight: 400, minWidth: "1ch" }}>
        {toFaDigits(count)}
      </span>
    </button>
  );
}
