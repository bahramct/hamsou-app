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
import type { GoalType } from "@/types/goal";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_TITLE = 120;
// سقفِ بازه = ۳۰ روز. عمداً بدونِ اعلانِ قبلی — فقط هنگامِ ساخت با toast هشدار می‌دهد (TASK-28 فاز ۲).
const MAX_RANGE_DAYS = 30;

const COPY: Record<GoalType, { title: string; subtitle: string; label: string; placeholder: string }> = {
  goal: {
    title: "یک هدف، یک مسیر",
    subtitle: "یک هدف انتخاب کن و بازه‌اش را مشخص کن. هر روز می‌توانی دربارهٔ مسیرت بنویسی.",
    label: "هدفت چیست؟",
    placeholder: "مثلاً: یادگیری گیتار، اصلاح رژیم غذایی، خواندن یک کتاب…",
  },
  challenge: {
    title: "یک چالش، یک مسیر",
    subtitle: "یک چالشِ کوتاه انتخاب کن و بازه‌اش را مشخص کن. هر روز می‌توانی دربارهٔ مسیرت بنویسی.",
    label: "چالشت چیست؟",
    placeholder: "مثلاً: دو هفته بدون شبکه‌های اجتماعی، ده روز سحرخیزی…",
  },
};

function isoToUtc(iso: string): number {
  return new Date(`${iso}T00:00:00.000Z`).getTime();
}

interface Props {
  planningAllowed: boolean;
  todayIso: string;
}

export function GoalCreateForm({ planningAllowed, todayIso }: Props) {
  const router = useRouter();
  const [type, setType] = useState<GoalType>("goal");
  const [title, setTitle] = useState("");
  const [startIso, setStartIso] = useState(todayIso);
  const [endIso, setEndIso] = useState("");
  const [isPending, startTransition] = useTransition();
  const copy = COPY[type];

  if (!planningAllowed) {
    return (
      <div className="glass-strong mx-auto max-w-md rounded-3xl p-8 text-center shadow-paper animate-fade-up">
        <h1 className="text-lg font-semibold text-ink">برنامه‌ریزی و چالش</h1>
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
    // محدودیتِ ۳۰ روز — بدونِ اعلانِ قبلی؛ فقط همین‌جا هنگامِ ساخت هشدار می‌دهد.
    if (rangeDays > MAX_RANGE_DAYS) {
      toast.error("بازهٔ یک هدف یا چالش حداکثر ۳۰ روز است");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/goal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), type, startIso, endIso }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success(type === "challenge" ? "چالشت ثبت شد" : "هدفت ثبت شد");
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
        <h1 className="text-xl font-semibold text-ink">{copy.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone">{copy.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="glass-strong rounded-3xl p-6 shadow-paper space-y-5">
          {/* انتخابِ نوع — هدف یا چالش (toggleِ حالت، نه اکشن) */}
          <TypeSelector type={type} onChange={setType} disabled={isPending} />

          <label className="block">
            <span className="mb-2 block text-xs font-medium text-stone">{copy.label}</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={copy.placeholder}
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

// ─── انتخابِ نوع — سگمنتیِ هدف/چالش ──────────────────────────────────────────
function TypeSelector({
  type,
  onChange,
  disabled,
}: {
  type: GoalType;
  onChange: (t: GoalType) => void;
  disabled: boolean;
}) {
  const items: { value: GoalType; label: string; hint: string; icon: React.ReactNode; active: string }[] = [
    {
      value: "goal",
      label: "هدف",
      hint: "یک مسیرِ آرام",
      active: "bg-sage/15 text-sage-deep ring-1 ring-sage/30",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 21v-8M12 13c0-4 3-7 8-7-.2 4-3 7-8 7Zm0 1c0-4.4-3-7.5-8-7.5C4.2 11 7 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      value: "challenge",
      label: "چالش",
      hint: "یک فشردهٔ کوتاه",
      active: "bg-ember/12 text-ember ring-1 ring-ember/25",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/4 p-1.5">
      {items.map((it) => {
        const isActive = type === it.value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            disabled={disabled}
            aria-pressed={isActive}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2.5 transition-all duration-200 disabled:opacity-50 ${
              isActive ? it.active : "text-stone hover:bg-black/4"
            }`}
          >
            <span className="flex items-center gap-1.5 text-[13px] font-medium">
              {it.icon}
              {it.label}
            </span>
            <span className="text-[10.5px] text-fog">{it.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
