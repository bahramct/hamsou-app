"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GoalEditModal — ویرایشِ هدف (فقط در روزِ اول — DECISION-082)
// عنوان + تاریخِ پایان. متن دکمه ثابت + Spinner + toast (DECISION-053).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { JalaliDatePicker } from "@/components/ui/JalaliDatePicker";
import { Portal } from "@/components/ui/Portal";
import { toast } from "@/lib/notifications/toast";
import type { SerializedGoal } from "@/types/goal";

const MAX_TITLE = 120;
const MAX_RANGE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isoToUtc(iso: string): number {
  return new Date(`${iso}T00:00:00.000Z`).getTime();
}

export function GoalEditModal({
  goal,
  todayIso,
  onClose,
}: {
  goal: SerializedGoal;
  todayIso: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [endIso, setEndIso] = useState(goal.endIso);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  function save() {
    const t = title.trim();
    if (!t || isPending) return;
    // محدودیتِ ۳۰ روز — بدونِ اعلانِ قبلی؛ فقط هنگامِ ذخیره هشدار می‌دهد.
    if (Math.round((isoToUtc(endIso) - isoToUtc(goal.startIso)) / MS_PER_DAY) + 1 > MAX_RANGE_DAYS) {
      toast.error("بازهٔ یک هدف یا چالش حداکثر ۳۰ روز است");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goal/${goal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "edit", title: t, endIso }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success("هدف ویرایش شد");
          router.refresh();
          close();
        } else {
          toast.error(data.message ?? "مشکلی پیش آمد");
        }
      } catch {
        toast.error("اتصال برقرار نشد");
      }
    });
  }

  const canSave = title.trim().length > 0 && title.length <= MAX_TITLE && endIso > goal.startIso && endIso >= todayIso && !isPending;

  return (
    <Portal>
    <>
      <div
        aria-hidden
        onClick={close}
        className="fixed inset-0 z-50"
        style={{
          background: "rgba(26,26,31,0.28)",
          backdropFilter: visible ? "blur(8px)" : "none",
          opacity: visible ? 1 : 0,
          transition: "opacity 220ms ease, backdrop-filter 220ms ease",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-5"
        role="dialog"
        aria-modal="true"
        aria-label="ویرایش هدف"
      >
        <div
          className="pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl border border-black/8 shadow-[0_20px_60px_rgba(26,26,31,0.22),0_0_0_1px_rgba(255,255,255,0.5)_inset]"
          style={{
            background: "rgba(var(--rgb-paper),0.96)",
            backdropFilter: "blur(28px) saturate(150%)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.94)",
            transition: "opacity 220ms ease, transform 280ms cubic-bezier(0.19,1,0.22,1)",
          }}
        >
          <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">ویرایشِ هدف</h2>
            <button
              type="button"
              onClick={close}
              aria-label="بستن"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/6 transition-colors hover:bg-black/10"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 px-5 py-5">
            {/* عنوان */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone">عنوانِ هدف</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE}
                dir="rtl"
                disabled={isPending}
                className="w-full rounded-xl border border-bone bg-white/60 px-4 py-2.5 text-sm text-ink focus:border-sage/50 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* تاریخ پایان */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone">تاریخِ پایان</label>
              <JalaliDatePicker
                value={endIso}
                onChange={setEndIso}
                disabled={isPending}
                clearable={false}
                className="w-full"
              />
              <p className="mt-1 text-[11px] text-fog">باید بعد از امروز باشد.</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-black/6 px-5 py-3.5">
            <button
              type="button"
              onClick={close}
              disabled={isPending}
              className="rounded-full px-4 py-2 text-sm text-stone hover:bg-black/5"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="flex items-center gap-2 rounded-full bg-sage px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-sage-deep disabled:opacity-40"
            >
              {isPending && <Spinner size={13} />}
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </>
    </Portal>
  );
}
