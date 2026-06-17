"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GoalStoryboard — نمای هدفِ فعال (DECISION-082؛ TASK-28، پیاده‌سازیِ مو‌به‌موی
// mockups/goal-journey.html). بِنتو: «hero comp / path path».
//   hero  = بَج + عنوان + روز X از Y + منو(…) + راهنما + آهنگ‌سازِ استوریِ امروز (bare)
//   comp  = پنلِ «همراه» (طلایی، bare)
//   path  = ریلِ سفر (JourneyRail) + راهنما
// منبعِ حقیقت = props سرور؛ هر تغییر با router.refresh اعمال می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { buildJourneyNodes } from "@/lib/goal/storyboard";
import { GoalTypeBadge } from "@/components/features/goal/GoalTypeBadge";
import { StoryComposer } from "@/components/features/goal/StoryComposer";
import { CompanionPanel } from "@/components/features/goal/CompanionPanel";
import { JourneyRail } from "@/components/features/goal/JourneyRail";
import { DayDetailModal } from "@/components/features/goal/DayDetailModal";
import { ReminderSettingsModal } from "@/components/features/goal/ReminderSettingsModal";
import { GoalEditModal } from "@/components/features/goal/GoalEditModal";
import { GoalDeleteModal } from "@/components/features/goal/GoalDeleteModal";
import type { ActiveGoalView } from "@/types/goal";

function fa(n: number): string {
  return n.toLocaleString("fa-IR");
}

export function GoalStoryboard({ view, todayIso }: { view: ActiveGoalView; todayIso: string }) {
  const goal = view.goal!;
  const [openIso, setOpenIso] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const notStarted = goal.dayNumber < 1;
  const nodes = buildJourneyNodes(goal.startIso, goal.endIso, todayIso, view.stories, view.insights);
  const openSlot = openIso ? nodes.find((n) => n.iso === openIso) ?? null : null;
  const todayInsight = view.insights.find((i) => i.dayKey === todayIso) ?? null;
  const todayNode = nodes.find((n) => n.iso === todayIso) ?? null;
  const todayStory = todayNode?.stories[0] ?? null;
  const canEdit = goal.dayNumber <= 1;

  const remaining = goal.daysRemaining;
  const remainingLabel =
    remaining > 0
      ? `${fa(remaining)} روز مانده`
      : remaining === 0
        ? "امروز روزِ پایان است"
        : "به پایان رسیده";

  return (
    <div className="animate-fade-up">
      <p className="jp-title"><b>برنامه‌ریزی و چالش</b> — یک مسیرِ فعال در هر زمان</p>

      <div className="jp-bento">
        {/* ── هیرو ── */}
        <div className="jp-tile jp-hero glass">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="گزینه‌ها"
            className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone transition-colors hover:bg-black/5"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <circle cx="8" cy="3" r="1.4" /><circle cx="8" cy="8" r="1.4" /><circle cx="8" cy="13" r="1.4" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
              <div className="absolute left-4 top-12 z-20 w-52 overflow-hidden rounded-2xl border border-black/8 bg-paper py-1 shadow-[0_12px_40px_rgba(26,26,31,0.16)]">
                <button type="button" onClick={() => { setMenuOpen(false); setReminderOpen(true); }} className="flex w-full items-center justify-between px-4 py-2.5 text-right text-[13px] text-ink hover:bg-black/4">
                  یادآوری {view.reminder.enabled && <span className="h-1.5 w-1.5 rounded-full bg-sage" />}
                </button>
                {canEdit && (
                  <button type="button" onClick={() => { setMenuOpen(false); setEditOpen(true); }} className="block w-full px-4 py-2.5 text-right text-[13px] text-ink hover:bg-black/4">
                    ویرایشِ هدف
                  </button>
                )}
                <div className="mx-3 my-1 h-px bg-black/6" />
                <button type="button" onClick={() => { setMenuOpen(false); setDeleteOpen(true); }} className="block w-full px-4 py-2.5 text-right text-[13px] text-stone hover:bg-ember/6 hover:text-ember">
                  پایانِ مسیر
                </button>
              </div>
            </>
          )}

          <div className="flex items-center gap-2.5" style={{ marginBottom: 2 }}>
            <span className={`tile-ic ${goal.type === "challenge" ? "ic-ember" : "ic-sage"}`} aria-hidden>
              {goal.type === "challenge" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></svg>
              )}
            </span>
            <GoalTypeBadge type={goal.type} />
          </div>
          <h1 className="jp-hero-title">{goal.title}</h1>
          <div className="jp-hero-meta">
            <span className="jp-hero-day fa-num">روز {fa(goal.dayNumber > 0 ? goal.dayNumber : 0)} از {fa(goal.totalDays)}</span>
            <span className="text-[11px] text-fog fa-num">{remainingLabel}</span>
          </div>

          {notStarted ? (
            <p className="jp-story fa-num" style={{ marginTop: 14 }}>
              مسیرت از {goal.startLabel} شروع می‌شود. از همان روز می‌توانی بنویسی.
            </p>
          ) : (
            <>
              <p className="jp-hero-hint">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 3 }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="M12 8v.5M12 11.5v4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                روزهای مسیرت را با فلش‌ها ببین؛ روزهای پُرمتن نشانِ طلایی دارند و با کلیک کامل باز می‌شوند
              </p>
              <div style={{ marginTop: 14 }}>
                <StoryComposer
                  goalId={goal.id}
                  todayLabel={todayNode?.dayLabel ?? goal.startLabel}
                  weekdayLabel={todayNode?.weekdayLabel ?? ""}
                  todayStory={todayStory}
                  bare
                />
              </div>
            </>
          )}
        </div>

        {/* ── همراه ── (محتوا absolute پر می‌کند تا ارتفاعِ ردیف را بزرگ نکند و بدنه اسکرول شود) */}
        <div className="jp-tile jp-comp glass">
          <div className="jp-comp-fill">
            <CompanionPanel goalId={goal.id} companion={view.companion} todayInsight={todayInsight} bare />
          </div>
        </div>

        {/* ── مسیر ── */}
        <div className="jp-tile jp-path glass">
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <span className="tile-ic ic-mist" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h7a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h7" /></svg>
            </span>
            <span className="jp-lbl" style={{ marginBottom: 0 }}>مسیرت تا اینجا</span>
          </div>
          <JourneyRail nodes={nodes} onOpen={(iso) => setOpenIso(iso)} />
        </div>
      </div>

      {openSlot && <DayDetailModal slot={openSlot} onClose={() => setOpenIso(null)} />}
      {reminderOpen && (
        <ReminderSettingsModal goalId={goal.id} config={view.reminder} onClose={() => setReminderOpen(false)} />
      )}
      {editOpen && <GoalEditModal goal={goal} todayIso={todayIso} onClose={() => setEditOpen(false)} />}
      {deleteOpen && <GoalDeleteModal goalId={goal.id} goalTitle={goal.title} onClose={() => setDeleteOpen(false)} />}
    </div>
  );
}
