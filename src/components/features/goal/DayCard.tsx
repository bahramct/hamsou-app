"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DayCard — کارتِ یک روز در استوری‌بوردِ افقی (DECISION-082)
// ارتفاعِ انعطاف‌پذیر، طراحیِ شیشه‌ایِ شیک. بدون درصد/استریک.
// ─────────────────────────────────────────────────────────────────────────────

import { MOOD_LABELS } from "@/lib/goal/storyboard";
import type { DaySlot } from "@/lib/goal/storyboard";

const MOOD_COLORS: Record<string, string> = {
  good: "bg-sage/12 text-sage-deep",
  neutral: "bg-stone/10 text-stone",
  hard: "bg-ember/10 text-ember",
};

export function DayCard({ slot, onClick }: { slot: DaySlot; onClick: () => void }) {
  const first = slot.stories[0];
  const hasStory = !!first;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative flex w-44 shrink-0 snap-start flex-col rounded-2xl
        border p-4 text-right
        transition-all duration-200 hover:-translate-y-1 hover:shadow-paper-sm
        ${slot.isToday
          ? "border-sage/35 shadow-[0_4px_20px_rgba(var(--rgb-sage),0.12),0_0_0_1px_rgba(var(--rgb-sage),0.15)_inset]"
          : hasStory
            ? "border-black/8 bg-white/65 shadow-[0_2px_12px_rgba(26,26,31,0.06)] hover:border-black/12 hover:bg-white/80"
            : "border-bone bg-white/40 hover:border-stone/20 hover:bg-white/55"
        }
      `}
      style={slot.isToday ? { background: "rgba(var(--rgb-paper),0.85)", backdropFilter: "blur(12px)" } : undefined}
    >
      {/* سرِ کارت */}
      <div className="flex items-start justify-between gap-1">
        <div>
          <span className={`block text-[11px] font-semibold fa-num leading-tight ${slot.isToday ? "text-sage-deep" : "text-stone"}`}>
            روز {slot.dayNumber.toLocaleString("fa-IR")}
          </span>
          {slot.isToday && (
            <span className="mt-0.5 block text-[9px] font-medium tracking-wide text-sage-deep/70 uppercase">امروز</span>
          )}
        </div>
        {slot.insight && (
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sage-deep"
            title="راهنماییِ همراه"
          >
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M4 2v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M4 2.75h7l-1.4 2.25L11 7.25H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>

      <span className="mt-1 block text-[10px] text-fog fa-num leading-tight">{slot.dayLabel}</span>

      {/* محتوای استوری */}
      <div className="mt-3 flex-1">
        {hasStory ? (
          <p className="text-[12.5px] leading-relaxed text-ink line-clamp-5">{first.content}</p>
        ) : (
          <p className={`text-[12px] italic leading-relaxed ${slot.isToday ? "text-sage-deep/50" : "text-fog"}`}>
            {slot.isToday ? "بنویس…" : "خالی ماند"}
          </p>
        )}
      </div>

      {/* پاورقی */}
      {(hasStory && first.mood) || hasStory ? (
        <div className="mt-3 border-t border-black/5 pt-2.5">
          {first?.mood ? (
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${MOOD_COLORS[first.mood] ?? "bg-black/5 text-stone"}`}>
              {MOOD_LABELS[first.mood]}
            </span>
          ) : (
            <span className="text-[10px] text-fog/70">بدون حال</span>
          )}
        </div>
      ) : null}

      {/* نشانِ hover برای روزهای خالی */}
      {!hasStory && slot.isToday && (
        <div className="mt-3 border-t border-sage/15 pt-2">
          <span className="text-[10px] text-sage-deep/60">استوریِ امروز ←</span>
        </div>
      )}
    </button>
  );
}
