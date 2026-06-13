"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GoalHeader — سرآیندِ هدفِ فعال (DECISION-082)
// عنوان، بازهٔ شمسی، «N روز مانده» (موقعیتِ زمانی، نه درصد). منوی: یادآوری/پایان/رها.
// متنِ دکمه‌ها ثابت + toast (DECISION-053). بدون استریک/گیمیفیکیشن.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import type { SerializedGoal } from "@/types/goal";

export function GoalHeader({
  goal,
  hasReminder,
  onOpenReminder,
}: {
  goal: SerializedGoal;
  hasReminder: boolean;
  onOpenReminder: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "complete" | "abandon">(null);
  const [isPending, startTransition] = useTransition();

  const remaining = goal.daysRemaining;
  const remainingLabel =
    remaining > 0
      ? `${remaining.toLocaleString("fa-IR")} روز مانده`
      : remaining === 0
        ? "امروز روزِ پایان است"
        : "به پایان رسیده";

  function act(action: "complete" | "abandon") {
    if (isPending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goal/${goal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success(action === "complete" ? "مسیر به پایان رسید" : "هدف رها شد");
          router.refresh();
        } else {
          toast.error(data.message ?? "مشکلی پیش آمد");
        }
      } catch {
        toast.error("اتصال برقرار نشد");
      }
    });
  }

  return (
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
          onClick={() => {
            setMenuOpen((v) => !v);
            setConfirm(null);
          }}
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
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onOpenReminder();
              }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-right text-[13px] text-ink hover:bg-black/4"
            >
              یادآوری
              {hasReminder && <span className="h-1.5 w-1.5 rounded-full bg-sage" />}
            </button>

            {confirm === "complete" ? (
              <ConfirmRow label="به پایان رساندن؟" onYes={() => act("complete")} onNo={() => setConfirm(null)} disabled={isPending} />
            ) : (
              <button type="button" onClick={() => setConfirm("complete")} className="block w-full px-4 py-2.5 text-right text-[13px] text-ink hover:bg-black/4">
                به پایان رساندن
              </button>
            )}

            {confirm === "abandon" ? (
              <ConfirmRow label="رها شود؟" tone="ember" onYes={() => act("abandon")} onNo={() => setConfirm(null)} disabled={isPending} />
            ) : (
              <button type="button" onClick={() => setConfirm("abandon")} className="block w-full px-4 py-2.5 text-right text-[13px] text-stone hover:bg-ember/6 hover:text-ember">
                رها کردنِ هدف
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ConfirmRow({
  label,
  tone = "sage",
  onYes,
  onNo,
  disabled,
}: {
  label: string;
  tone?: "sage" | "ember";
  onYes: () => void;
  onNo: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 bg-black/3 px-4 py-2.5">
      <span className="text-[12px] text-stone">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onYes}
          disabled={disabled}
          className={`rounded-full px-3 py-1 text-[12px] font-medium text-paper disabled:opacity-40 ${tone === "ember" ? "bg-ember" : "bg-sage"}`}
        >
          بله
        </button>
        <button type="button" onClick={onNo} className="rounded-full px-2.5 py-1 text-[12px] text-fog hover:bg-black/5">
          خیر
        </button>
      </div>
    </div>
  );
}
