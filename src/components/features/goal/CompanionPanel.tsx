"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CompanionPanel — راهنماییِ «همراه» (کوچ هدف، DECISION-082)
// Pro-only؛ از روزِ سوم تا قبل از پایان؛ روزی یک‌بار. متنِ دکمه ثابت + Spinner + toast.
// لحنِ آرام؛ بدون قضاوت/استریک. FREE/PLUS → کارتِ دعوت به ارتقا.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import type { GoalCompanionState, SerializedInsight } from "@/types/goal";

interface Props {
  goalId: string;
  companion: GoalCompanionState;
  todayInsight: SerializedInsight | null;
}

function InsightBody({ insight }: { insight: SerializedInsight }) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-loose text-ink">{insight.reflection}</p>

      {insight.observations.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-medium text-stone">آنچه دیدم</p>
          <ul className="space-y-1">
            {insight.observations.map((o, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-stone">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {insight.suggestions.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-medium text-stone">یک قدم برای ادامه</p>
          <ul className="space-y-1">
            {insight.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sage" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CompanionPanel({ goalId, companion, todayInsight }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── دعوت به ارتقا (FREE/PLUS) ───────────────────────────────────────────────
  if (!companion.planAllowed) {
    return (
      <div className="rounded-3xl border border-gold/25 bg-gold/5 p-5">
        <div className="flex items-center gap-2">
          <CompanionMark />
          <h3 className="text-sm font-semibold text-ink">همراه — کوچِ مسیرت</h3>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-stone">
          «همراه» با نگاه به کلِ مسیرت، روند را تحلیل می‌کند و راهنمایی‌ات می‌کند. این بخش
          مخصوصِ پلن پروست.
        </p>
        <Link
          href="/plans"
          className="mt-4 inline-block rounded-full bg-gold px-5 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90"
        >
          آشنایی با پلن پرو
        </Link>
      </div>
    );
  }

  const header = (
    <div className="flex items-center gap-2">
      <CompanionMark />
      <h3 className="text-sm font-semibold text-ink">همراه</h3>
    </div>
  );

  // ── پنجره باز نیست ───────────────────────────────────────────────────────────
  if (!companion.windowOpen && !todayInsight) {
    const msg =
      companion.reason === "before_day_2"
        ? "راهنماییِ «همراه» از روزِ دومِ مسیر در دسترس می‌شود."
        : "مسیرِ این هدف رو به پایان است — راهنماییِ تازه‌ای نیست.";
    return (
      <div className="rounded-3xl border border-bone bg-white/40 p-5">
        {header}
        <p className="mt-2 text-[13px] leading-relaxed text-stone">{msg}</p>
      </div>
    );
  }

  // ── راهنماییِ امروز موجود است ─────────────────────────────────────────────────
  if (todayInsight) {
    return (
      <div className="rounded-3xl border border-sage/20 bg-sage/5 p-5">
        <div className="mb-3 flex items-center justify-between">
          {header}
          <span className="text-[11px] text-fog">راهنماییِ امروز</span>
        </div>
        <InsightBody insight={todayInsight} />
      </div>
    );
  }

  // ── دکمهٔ دریافتِ راهنمایی ─────────────────────────────────────────────────────
  function handleGenerate() {
    if (isPending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goal/${goalId}/companion`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success("راهنماییِ همراه آماده شد");
          router.refresh();
        } else if (res.status === 409) {
          router.refresh();
        } else {
          toast.error(data.message ?? "همراه الان در دسترس نیست — کمی بعد دوباره تلاش کن");
        }
      } catch {
        toast.error("اتصال برقرار نشد — دوباره تلاش کن");
      }
    });
  }

  return (
    <div className="rounded-3xl border border-sage/20 bg-sage/5 p-5">
      {header}
      <p className="mt-2 text-[13px] leading-relaxed text-stone">
        امروز می‌توانی یک‌بار از راهنماییِ «همراه» دربارهٔ مسیرت استفاده کنی.
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="mt-4 flex items-center justify-center gap-2 rounded-full bg-sage px-6 py-2.5 text-sm font-medium text-paper shadow-paper transition-all duration-300 hover:bg-sage-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending && <Spinner />}
        از همراه راهنمایی بگیر
      </button>
    </div>
  );
}

function CompanionMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage/15 text-sage-deep">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4 2v12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M4 2.75h7l-1.4 2.25L11 7.25H4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
