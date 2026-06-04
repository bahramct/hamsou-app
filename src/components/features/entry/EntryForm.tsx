"use client";

// ─────────────────────────────────────────────────────────────────────────────
// EntryForm — فرم ثبت تعهد روزانه (وقتی هنوز تعهدی ثبت نشده)
//
// حالت‌ها:
//   ● idle     — فرم خالی، آماده دریافت ورودی
//   ● pending  — در حال ارسال به server
//   ● error    — خطا در ثبت
//
// پس از ثبت موفق، router.refresh() صفحه را دوباره render می‌کند
// (Server Component داده جدید را از DB می‌خواند و EntryCard نمایش می‌دهد).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const MIN_CHARS = 5;
const MAX_CHARS = 500;

interface Props {
  /** نمایش شمسی امروز — مثال: «۲۶ اردیبهشت ۱۴۰۳» */
  todayLabel: string;
  /** روز هفته — مثال: «یکشنبه» */
  weekdayLabel: string;
}

export function EntryForm({ todayLabel, weekdayLabel }: Props) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const remaining = MAX_CHARS - content.length;
  const isOverLimit = remaining < 0;
  const canSubmit = content.trim().length >= MIN_CHARS && !isOverLimit && !isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (res.ok) {
          // Server Component را مجدد render می‌کنیم تا EntryCard نمایش داده شود
          router.refresh();
        } else {
          const data = (await res.json()) as { error?: string; message?: string };
          if (data.error === "already_exists_today") {
            setError("برای امروز قبلاً تعهد ثبت کردی");
          } else if (data.message) {
            setError(data.message);
          } else {
            setError("مشکلی پیش اومد — دوباره تلاش کن");
          }
        }
      } catch {
        setError("اتصال برقرار نشد — دوباره تلاش کن");
      }
    });
  }

  return (
    <div className="w-full max-w-lg animate-fade-up">
      {/* تاریخ امروز */}
      <div className="text-center mb-10">
        <p className="text-xs text-fog mb-1 fa-num">{weekdayLabel}</p>
        <p className="text-sm text-stone fa-num">{todayLabel}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* کارت فرم */}
        <div className="glass-strong rounded-3xl p-6 shadow-paper">
          <label className="block">
            <span className="block text-xs text-stone mb-4 font-medium">
              امروز چه می‌خواهی انجام دهی؟
            </span>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="یک تعهد واقعی به خودت…"
              rows={5}
              disabled={isPending}
              className="
                w-full resize-none bg-transparent
                text-ink text-sm leading-loose
                placeholder:text-fog
                focus:outline-none
                disabled:opacity-50
              "
              dir="rtl"
              autoFocus
            />
          </label>

          {/* خط جداکننده + counter */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-bone">
            {error ? (
              <p className="text-xs text-ember">{error}</p>
            ) : (
              <span />
            )}
            <span
              className={`text-xs fa-num tabular-nums ${
                isOverLimit ? "text-ember" : remaining < 50 ? "text-gold" : "text-fog"
              }`}
            >
              {remaining.toLocaleString("fa-IR")}
            </span>
          </div>
        </div>

        {/* دکمه ثبت */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="
            w-full py-4 rounded-full
            bg-sage text-paper text-sm font-medium
            shadow-paper
            hover:bg-sage-deep
            active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-300
          "
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74" />
              </svg>
              در حال ثبت…
            </span>
          ) : (
            "ثبت تعهد"
          )}
        </button>
      </form>
    </div>
  );
}
