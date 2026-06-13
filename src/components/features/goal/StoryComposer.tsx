"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StoryComposer — نوشتنِ استوریِ امروز برای هدف (DECISION-082)
// نوشتهٔ روایی + حالِ اختیاری (خوب/معمولی/سخت، بدون نمره). متنِ دکمه ثابت + Spinner + toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import { MOOD_LABELS } from "@/lib/goal/storyboard";
import type { GoalMood } from "@/types/goal";

const MAX = 4000;
const MOODS: GoalMood[] = ["good", "neutral", "hard"];

interface Props {
  goalId: string;
  todayLabel: string;
  weekdayLabel: string;
}

export function StoryComposer({ goalId, todayLabel, weekdayLabel }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<GoalMood | null>(null);
  const [isPending, startTransition] = useTransition();

  const remaining = MAX - content.length;
  const canSubmit = content.trim().length > 0 && remaining >= 0 && !isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goal/${goalId}/story`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim(), mood }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success("استوریت ثبت شد");
          setContent("");
          setMood(null);
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
    <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-5 shadow-paper">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs font-medium text-stone">امروز در مسیرت چه گذشت؟</span>
        <span className="text-[11px] text-fog fa-num">
          {weekdayLabel} · {todayLabel}
        </span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="هرچه دلت می‌خواهد بنویس — از حال‌وهوا تا چالش‌ها و قدم‌های کوچک…"
        rows={4}
        disabled={isPending}
        dir="rtl"
        className="w-full resize-none bg-transparent text-sm leading-loose text-ink placeholder:text-fog focus:outline-none disabled:opacity-50"
      />

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-bone pt-3">
        {/* حالِ اختیاری */}
        <div className="flex items-center gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood((cur) => (cur === m ? null : m))}
              className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                mood === m
                  ? "bg-sage/15 text-sage-deep ring-1 ring-sage/30"
                  : "text-fog hover:bg-black/4 hover:text-stone"
              }`}
            >
              {MOOD_LABELS[m]}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center justify-center gap-2 rounded-full bg-sage px-6 py-2.5 text-sm font-medium text-paper shadow-paper transition-all duration-300 hover:bg-sage-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending && <Spinner />}
          ثبت استوری
        </button>
      </div>
    </form>
  );
}
