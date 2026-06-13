"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GoalCreateForm — ساختِ هدفِ جدید (DECISION-082)
// عنوان + تاریخ شروع/پایان (JalaliDatePicker، نه type=date). اعتبارسنجیِ شروع ≥ امروز.
// متنِ دکمه ثابت؛ حینِ کار Spinner؛ نتیجه با toast (DECISION-053).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JalaliDatePicker } from "@/components/ui/JalaliDatePicker";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_TITLE = 120;

function isoToUtc(iso: string): number {
  return new Date(`${iso}T00:00:00.000Z`).getTime();
}

interface Props {
  planningAllowed: boolean;
  todayIso: string;
}

export function GoalCreateForm({ planningAllowed, todayIso }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [startIso, setStartIso] = useState(todayIso);
  const [endIso, setEndIso] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!planningAllowed) {
    return (
      <div className="glass-strong mx-auto max-w-md rounded-3xl p-8 text-center shadow-paper animate-fade-up">
        <h1 className="text-lg font-semibold text-ink">برنامه‌ریزی</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          این بخش در پلن فعلی شما در دسترس نیست.
        </p>
        <Link
          href="/plans"
          className="mt-5 inline-block rounded-full bg-sage px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-sage-deep"
        >
          دیدن پلن‌ها
        </Link>
      </div>
    );
  }

  const rangeDays =
    startIso && endIso
      ? Math.round((isoToUtc(endIso) - isoToUtc(startIso)) / MS_PER_DAY) + 1
      : 0;

  const valid =
    title.trim().length > 0 &&
    title.trim().length <= MAX_TITLE &&
    !!startIso &&
    !!endIso &&
    isoToUtc(startIso) >= isoToUtc(todayIso) &&
    isoToUtc(endIso) > isoToUtc(startIso);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || isPending) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/goal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), startIso, endIso }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success("هدفت ثبت شد");
          router.refresh();
        } else {
          toast.error(data.message ?? "مشکلی پیش آمد — دوباره تلاش کن");
        }
      } catch {
        toast.error("اتصال برقرار نشد — دوباره تلاش کن");
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg animate-fade-up">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold text-ink">یک هدف، یک مسیر</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          یک هدف انتخاب کن و بازه‌اش را مشخص کن. هر روز می‌توانی دربارهٔ مسیرت بنویسی.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="glass-strong rounded-3xl p-6 shadow-paper space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-stone">هدفت چیست؟</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: یادگیری گیتار، اصلاح رژیم غذایی، خواندن یک کتاب…"
              maxLength={MAX_TITLE + 10}
              disabled={isPending}
              dir="rtl"
              autoFocus
              className="w-full bg-transparent text-sm text-ink placeholder:text-fog focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 border-t border-bone pt-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-stone">تاریخ شروع</span>
              <JalaliDatePicker
                value={startIso}
                onChange={setStartIso}
                clearable={false}
                placeholder="انتخاب تاریخ شروع"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-stone">تاریخ پایان</span>
              <JalaliDatePicker
                value={endIso}
                onChange={setEndIso}
                clearable={false}
                placeholder="انتخاب تاریخ پایان"
              />
            </label>
          </div>

          {rangeDays > 0 && isoToUtc(endIso) > isoToUtc(startIso) && (
            <p className="text-xs text-fog fa-num">
              مدتِ مسیر: {rangeDays.toLocaleString("fa-IR")} روز
            </p>
          )}
          {startIso && isoToUtc(startIso) < isoToUtc(todayIso) && (
            <p className="text-xs text-ember">تاریخ شروع نمی‌تواند قبل از امروز باشد.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!valid || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-sage py-4 text-sm font-medium text-paper shadow-paper transition-all duration-300 hover:bg-sage-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending && <Spinner />}
          شروع مسیر
        </button>
      </form>
    </div>
  );
}
