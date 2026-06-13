"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GoalStoryboard — نمای هدفِ فعال (DECISION-082)
// چیدمانِ آرام: سرآیند + آهنگ‌سازِ استوریِ امروز + پنلِ همراه + استوری‌بوردِ افقیِ روزها.
// منبعِ حقیقت = props سرور؛ هر تغییر با router.refresh اعمال می‌شود (state تکراری نداریم).
// استوری‌بوردِ افقی با خطِ زمانیِ ظریفِ متصل‌کننده (انتخابِ مالک) — بدون درصد/استریک.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { buildDaySlots } from "@/lib/goal/storyboard";
import { GoalHeader } from "@/components/features/goal/GoalHeader";
import { StoryComposer } from "@/components/features/goal/StoryComposer";
import { CompanionPanel } from "@/components/features/goal/CompanionPanel";
import { DayCard } from "@/components/features/goal/DayCard";
import { DayDetailModal } from "@/components/features/goal/DayDetailModal";
import { ReminderSettingsModal } from "@/components/features/goal/ReminderSettingsModal";
import type { ActiveGoalView } from "@/types/goal";

export function GoalStoryboard({ view, todayIso }: { view: ActiveGoalView; todayIso: string }) {
  const goal = view.goal!;
  const [openIso, setOpenIso] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);

  const notStarted = goal.dayNumber < 1;
  const slots = buildDaySlots(goal.startIso, goal.endIso, todayIso, view.stories, view.insights);
  const openSlot = openIso ? slots.find((s) => s.iso === openIso) ?? null : null;
  const todayInsight = view.insights.find((i) => i.dayKey === todayIso) ?? null;
  const todayStory = slots[0]?.iso === todayIso ? (slots[0]?.stories[0] ?? null) : null;

  return (
    <div className="space-y-5 animate-fade-up">
      <GoalHeader
        goal={goal}
        todayIso={todayIso}
        hasReminder={view.reminder.enabled}
        onOpenReminder={() => setReminderOpen(true)}
      />

      {notStarted ? (
        <div className="glass-strong rounded-3xl p-6 text-center shadow-paper">
          <p className="text-sm leading-relaxed text-stone fa-num">
            مسیرت از {goal.startLabel} شروع می‌شود. از همان روز می‌توانی بنویسی.
          </p>
        </div>
      ) : (
        <>
          {/* نوشتن/ویرایشِ استوریِ امروز — slots[0] = امروز */}
          <StoryComposer
            goalId={goal.id}
            todayLabel={slots[0]?.dayLabel ?? goal.startLabel}
            weekdayLabel={slots[0]?.weekdayLabel ?? ""}
            todayStory={todayStory}
          />

          {/* همراه */}
          <CompanionPanel goalId={goal.id} companion={view.companion} todayInsight={todayInsight} />

          {/* استوری‌بوردِ افقی */}
          <div>
            <div className="mb-2.5 flex items-center justify-between px-1">
              <h2 className="text-xs font-medium text-stone">مسیرت تا اینجا</h2>
              <span className="text-[11px] text-fog">برای دیدنِ هر روز، رویش بزن</span>
            </div>

            {slots.length === 0 ? (
              <p className="rounded-2xl border border-bone bg-white/40 px-4 py-6 text-center text-[13px] text-fog">
                هنوز روزی از مسیرت نگذشته.
              </p>
            ) : (
              <div className="relative">
                {/* خطِ زمانیِ ظریفِ متصل‌کننده */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-0 left-0 top-[1.45rem] h-px bg-gradient-to-l from-transparent via-stone/20 to-transparent"
                />
                <div className="flex snap-x gap-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden" dir="rtl">
                  {slots.map((slot) => (
                    <DayCard key={slot.iso} slot={slot} onClick={() => setOpenIso(slot.iso)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {openSlot && <DayDetailModal slot={openSlot} onClose={() => setOpenIso(null)} />}
      {reminderOpen && (
        <ReminderSettingsModal
          goalId={goal.id}
          config={view.reminder}
          onClose={() => setReminderOpen(false)}
        />
      )}
    </div>
  );
}
