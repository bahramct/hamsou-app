"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FeedbackForm — بازخورد تعهد روز قبل (TASK-006)
//
// این کامپوننت وقتی نشان داده می‌شود که:
//   ● کاربر یک تعهد از روزهای قبل دارد که هنوز بازخورد نداده
// پس از ثبت بازخورد، router.refresh() صفحه را دوباره render می‌کند
// و Server Component تعهد جدید یا EntryForm را نمایش می‌دهد.
//
// اصول طراحی (CLAUDE.md §۲):
//   ● هیچ پیام قضاوتی وجود ندارد — "انجام نشد" خنثی است، نه منفی
//   ● هیچ امتیاز، استریک یا مقایسه‌ای نیست
//   ● لحن آرام و همراه
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PendingFeedbackEntry } from "@/types/feedback";

type FeedbackStatus = "DONE" | "NOT_DONE";

const MAX_NOTE_CHARS = 300;

interface Props {
  pendingEntry: PendingFeedbackEntry;
  /** نمایش شمسی امروز — فقط برای نمایش context در بالای صفحه */
  todayLabel: string;
  weekdayLabel: string;
}

export function FeedbackForm({ pendingEntry, todayLabel, weekdayLabel }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const noteRemaining = MAX_NOTE_CHARS - note.length;
  const isOverLimit = noteRemaining < 0;
  const canSubmit = selectedStatus !== null && !isOverLimit && !isPending;

  async function handleSubmit() {
    if (!canSubmit || !selectedStatus) return;
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: pendingEntry.id,
          status: selectedStatus,
          note: note.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string; message?: string };

      if (!res.ok || !data.ok) {
        setError(data.message ?? "مشکلی پیش اومد — دوباره تلاش کن");
        return;
      }

      // موفق — صبر می‌کنیم router refresh بره
      setIsDone(true);
      startTransition(() => router.refresh());
    } catch {
      setError("اتصال برقرار نشد — دوباره تلاش کن");
    }
  }

  // حالت موفق — در حال refresh
  if (isDone) {
    return (
      <div className="w-full max-w-lg flex flex-col items-center justify-center gap-3 animate-fade-in">
        <span className="text-2xl">✓</span>
        <p className="text-stone text-sm">بازخورد ثبت شد</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg animate-fade-up" dir="rtl">
      {/* تاریخ امروز */}
      <div className="text-center mb-8">
        <p className="text-xs text-fog mb-1 fa-num">{weekdayLabel}</p>
        <p className="text-sm text-stone fa-num">{todayLabel}</p>
      </div>

      {/* توضیح */}
      <p className="text-center text-xs text-fog mb-5">
        پیش از تعهد امروز، بگو دیروز چه اتفاقی افتاد
      </p>

      {/* کارت تعهد قبلی */}
      <div className="glass-strong rounded-3xl p-5 shadow-paper mb-4">
        <p className="text-xs text-fog mb-3 fa-num">
          {pendingEntry.weekdayLabel} — {pendingEntry.dateLabel}
        </p>
        <p className="text-ink text-sm leading-loose">{pendingEntry.content}</p>
      </div>

      {/* سوال + دکمه‌های وضعیت */}
      <div className="glass-strong rounded-3xl p-5 shadow-paper space-y-4">
        <p className="text-xs text-stone font-medium text-center">چطور پیش رفت؟</p>

        <div className="grid grid-cols-2 gap-3">
          {/* انجام شد */}
          <button
            type="button"
            onClick={() => setSelectedStatus("DONE")}
            disabled={isPending}
            className={`
              flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl
              border-2 transition-all duration-200
              disabled:opacity-50
              ${
                selectedStatus === "DONE"
                  ? "border-ember bg-ember/8 text-ember"
                  : "border-bone bg-transparent text-stone hover:border-stone/40 hover:text-ink"
              }
            `}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-sm font-medium">انجام شد</span>
          </button>

          {/* انجام نشد — عمداً خنثی، بدون رنگ منفی */}
          <button
            type="button"
            onClick={() => setSelectedStatus("NOT_DONE")}
            disabled={isPending}
            className={`
              flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl
              border-2 transition-all duration-200
              disabled:opacity-50
              ${
                selectedStatus === "NOT_DONE"
                  ? "border-stone bg-stone/8 text-ink"
                  : "border-bone bg-transparent text-stone hover:border-stone/40 hover:text-ink"
              }
            `}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="w-5 h-5"
            >
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span className="text-sm font-medium">انجام نشد</span>
          </button>
        </div>

        {/* یادداشت — فقط بعد از انتخاب وضعیت */}
        {selectedStatus && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs text-fog">یادداشت (اختیاری)</label>
              {note.length > 0 && (
                <span
                  className={`text-xs fa-num tabular-nums ${
                    isOverLimit ? "text-ember" : noteRemaining < 50 ? "text-gold" : "text-fog"
                  }`}
                >
                  {noteRemaining.toLocaleString("fa-IR")}
                </span>
              )}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                selectedStatus === "DONE"
                  ? "چه چیزی کمک کرد؟ چطور احساس کردی؟"
                  : "چه اتفاقی افتاد؟ مانعی بود؟"
              }
              rows={3}
              disabled={isPending}
              className="
                w-full resize-none bg-transparent
                text-ink text-sm leading-loose
                placeholder:text-fog
                focus:outline-none
                disabled:opacity-50
              "
              dir="rtl"
            />
          </div>
        )}

        {/* خطا */}
        {error && (
          <p className="text-xs text-ember text-center">{error}</p>
        )}
      </div>

      {/* دکمه ثبت — فقط بعد از انتخاب وضعیت */}
      {selectedStatus && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="
            w-full mt-3 py-4 rounded-full
            bg-ink text-paper text-sm font-medium
            shadow-paper
            hover:bg-charcoal
            active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-300
            animate-fade-up
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
            "ثبت بازخورد"
          )}
        </button>
      )}
    </div>
  );
}
