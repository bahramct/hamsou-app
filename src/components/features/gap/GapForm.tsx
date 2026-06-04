"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GapForm — توضیح فاصله غیرفعالی (TASK-007)
//
// این کامپوننت وقتی نشان داده می‌شود که:
//   ● بازخورد تعهد قبلی ثبت شده (گیت TASK-006 پاک شده)
//   ● آخرین تعهد کاربر مربوط به قبل از دیروز است (یعنی روزهایی نبوده)
//   ● GapRecord برای این بازه هنوز ثبت نشده
//
// اصول طراحی (CLAUDE.md §۲):
//   ● لحن گرم و خوشامد — نه قضاوتی، نه تنبیهی
//   ● یادداشت کاملاً اختیاری — فشاری وجود ندارد
//   ● یک دکمه «ادامه» — همیشه به جلو می‌رود
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PendingGap } from "@/types/gap";

const MAX_NOTE_CHARS = 500;

interface Props {
  pendingGap: PendingGap;
  todayLabel: string;
  weekdayLabel: string;
}

export function GapForm({ pendingGap, todayLabel, weekdayLabel }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const noteRemaining = MAX_NOTE_CHARS - note.length;
  const isOverLimit = noteRemaining < 0;

  const daysText =
    pendingGap.days === 1
      ? "۱ روز"
      : `${pendingGap.days.toLocaleString("fa-IR")} روز`;

  async function handleContinue() {
    if (isOverLimit || isPending) return;
    setError(null);

    try {
      const res = await fetch("/api/gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string; message?: string };

      if (!res.ok || !data.ok) {
        setError(data.message ?? "مشکلی پیش اومد — دوباره تلاش کن");
        return;
      }

      setIsDone(true);
      startTransition(() => router.refresh());
    } catch {
      setError("اتصال برقرار نشد — دوباره تلاش کن");
    }
  }

  if (isDone) {
    return (
      <div className="w-full max-w-lg flex flex-col items-center justify-center gap-3 animate-fade-in">
        <p className="text-stone text-sm">ثبت شد</p>
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

      {/* پیام خوشامد */}
      <div className="text-center mb-6">
        <p className="text-ink text-xl font-medium mb-2">خوش برگشتی</p>
        <p className="text-stone text-sm fa-num">
          {daysText} از همسو دور بودی
        </p>
        {pendingGap.days > 1 ? (
          <p className="text-fog text-xs mt-1.5 fa-num">
            از {pendingGap.fromDateLabel} تا {pendingGap.toDateLabel}
          </p>
        ) : (
          <p className="text-fog text-xs mt-1.5 fa-num">
            {pendingGap.fromDateLabel}
          </p>
        )}
      </div>

      {/* فرم یادداشت */}
      <div className="glass-strong rounded-3xl p-6 shadow-paper">
        <label className="block">
          <span className="block text-xs text-stone mb-4 font-medium">
            می‌خوای بگی چه اتفاقی افتاد؟
          </span>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="(اختیاری) هر چیزی که می‌خوای بنویسی…"
            rows={4}
            disabled={isPending}
            maxLength={MAX_NOTE_CHARS + 10}
            className="
              w-full resize-none bg-transparent
              text-ink text-sm leading-loose
              placeholder:text-fog
              focus:outline-none
              disabled:opacity-50
            "
            dir="rtl"
          />

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-bone">
            {error ? (
              <p className="text-xs text-ember">{error}</p>
            ) : (
              <span className="text-xs text-fog">اختیاری — می‌تونی خالی بذاری</span>
            )}
            {note.length > 0 && (
              <span
                className={`text-xs fa-num tabular-nums ${
                  isOverLimit ? "text-ember" : noteRemaining < 80 ? "text-gold" : "text-fog"
                }`}
              >
                {noteRemaining.toLocaleString("fa-IR")}
              </span>
            )}
          </div>
        </label>
      </div>

      {/* دکمه ادامه */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={isPending || isOverLimit}
        className="
          w-full mt-3 py-4 rounded-full
          bg-ink text-paper text-sm font-medium
          shadow-paper
          hover:bg-charcoal
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
          "ادامه"
        )}
      </button>
    </div>
  );
}
