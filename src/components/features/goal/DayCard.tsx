"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DayCard — کارتِ یک روز در استوری‌بوردِ افقی (DECISION-082)
// نمایشِ آرام: شمارهٔ روز، تاریخ، پیش‌نمایشِ استوری، نشانِ «همراه». بدون استریک/درصد.
// ─────────────────────────────────────────────────────────────────────────────

import { MOOD_LABELS } from "@/lib/goal/storyboard";
import type { DaySlot } from "@/lib/goal/storyboard";

export function DayCard({ slot, onClick }: { slot: DaySlot; onClick: () => void }) {
  const first = slot.stories[0];
  const extra = slot.stories.length - 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-44 w-40 shrink-0 snap-start flex-col rounded-2xl border p-3.5 text-right transition-all duration-200 hover:-translate-y-0.5 ${
        slot.isToday
          ? "border-sage/40 bg-sage/8 shadow-paper"
          : "border-bone bg-white/55 hover:border-stone/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-medium fa-num ${slot.isToday ? "text-sage-deep" : "text-stone"}`}>
          روز {slot.dayNumber.toLocaleString("fa-IR")}
          {slot.isToday ? " · امروز" : ""}
        </span>
        {slot.insight && (
          <span className="text-sage-deep" title="راهنماییِ همراه">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M4 2v12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M4 2.75h7l-1.4 2.25L11 7.25H4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>
      <span className="mt-0.5 text-[10px] text-fog fa-num">{slot.dayLabel}</span>

      <div className="mt-2 flex-1 overflow-hidden">
        {first ? (
          <p className="text-[12.5px] leading-relaxed text-ink line-clamp-4">{first.content}</p>
        ) : (
          <p className="text-[12px] italic leading-relaxed text-fog">
            {slot.isToday ? "هنوز چیزی ننوشته‌ای" : "این روز خالی ماند"}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-bone/70 pt-2">
        {extra > 0 && (
          <span className="text-[10px] text-fog fa-num">+{(extra).toLocaleString("fa-IR")} استوری</span>
        )}
        {first?.mood && (
          <span className="rounded-full bg-black/4 px-2 py-0.5 text-[10px] text-stone">
            {MOOD_LABELS[first.mood]}
          </span>
        )}
      </div>
    </button>
  );
}
