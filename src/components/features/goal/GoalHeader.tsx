"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GoalHeader — سرآیندِ هدفِ فعال (DECISION-082)
// عنوان، بازهٔ شمسی، «N روز مانده» + «روز k از n».
// منو:
//   روزِ ۱ (dayNumber ≤ ۱): یادآوری + ویرایش هدف + حذف هدف
//   روزِ ۲+              : یادآوری + حذف هدف
// «به پایان رساندن» حذف شد — lazy-completion در /api/goal/[id]/server.ts مدیریت می‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { GoalEditModal } from "@/components/features/goal/GoalEditModal";
import { GoalDeleteModal } from "@/components/features/goal/GoalDeleteModal";
import type { SerializedGoal } from "@/types/goal";

export function GoalHeader({
  goal,
  todayIso,
  hasReminder,
  onOpenReminder,
}: {
  goal: SerializedGoal;
  todayIso: string;
  hasReminder: boolean;
  onOpenReminder: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canEdit = goal.dayNumber <= 1;

  const remaining = goal.daysRemaining;
  const remainingLabel =
    remaining > 0
      ? `${remaining.toLocaleString("fa-IR")} روز مانده`
      : remaining === 0
        ? "امروز روزِ پایان است"
        : "به پایان رسیده";

  function openEdit() {
    setMenuOpen(false);
    setEditOpen(true);
  }
  function openDelete() {
    setMenuOpen(false);
    setDeleteOpen(true);
  }

  return (
    <>
      <div className="glass-strong relative rounded-3xl p-5 shadow-paper">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-ink">{goal.title}</h1>
            <p className="mt-1 text-[12px] text-stone fa-num">
              {goal.startLabel} ← {goal.endLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="گزینه‌ها"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition-colors hover:bg-black/5"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <circle cx="8" cy="3" r="1.4" />
              <circle cx="8" cy="8" r="1.4" />
              <circle cx="8" cy="13" r="1.4" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-sage/10 px-3 py-1 text-[12px] font-medium text-sage-deep fa-num">
            روز {goal.dayNumber > 0 ? goal.dayNumber.toLocaleString("fa-IR") : "۰"} از {goal.totalDays.toLocaleString("fa-IR")}
          </span>
          <span className="text-[12px] text-fog fa-num">{remainingLabel}</span>
        </div>

        {/* منو */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
            <div className="absolute left-4 top-14 z-20 w-52 overflow-hidden rounded-2xl border border-black/8 bg-paper py-1 shadow-[0_12px_40px_rgba(26,26,31,0.16)]">
              {/* یادآوری */}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onOpenReminder(); }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-right text-[13px] text-ink hover:bg-black/4"
              >
                یادآوری
                {hasReminder && <span className="h-1.5 w-1.5 rounded-full bg-sage" />}
              </button>

              {/* ویرایش — فقط روزِ اول */}
              {canEdit && (
                <button
                  type="button"
                  onClick={openEdit}
                  className="block w-full px-4 py-2.5 text-right text-[13px] text-ink hover:bg-black/4"
                >
                  ویرایشِ هدف
                </button>
              )}

              <div className="mx-3 my-1 h-px bg-black/6" />

              {/* حذف */}
              <button
                type="button"
                onClick={openDelete}
                className="block w-full px-4 py-2.5 text-right text-[13px] text-stone hover:bg-ember/6 hover:text-ember"
              >
                پایانِ مسیر
              </button>
            </div>
          </>
        )}
      </div>

      {/* مودال‌ها */}
      {editOpen && (
        <GoalEditModal goal={goal} todayIso={todayIso} onClose={() => setEditOpen(false)} />
      )}
      {deleteOpen && (
        <GoalDeleteModal goalId={goal.id} goalTitle={goal.title} onClose={() => setDeleteOpen(false)} />
      )}
    </>
  );
}
