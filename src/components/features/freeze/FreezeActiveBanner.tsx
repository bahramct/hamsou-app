"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FreezeActiveBanner — نمایش فریز فعال در داشبورد (DECISION-083)
// جایگزین فرم تعهد در روزهای فریز.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import type { ActiveFreeze } from "@/types/gap";
import { toFaDigits } from "@/lib/utils/digits";

export function FreezeActiveBanner({
  freeze,
  todayLabel,
  weekdayLabel,
}: {
  freeze: ActiveFreeze;
  todayLabel: string;
  weekdayLabel: string;
}) {
  const router = useRouter();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isPending, startTransition] = useTransition();

  function cancelFreeze() {
    if (isPending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/freeze/${freeze.id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success("فریز لغو شد");
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
    <div className="w-full max-w-sm">
      {/* سرآیند تاریخ — مثل EntryForm */}
      <div className="mb-5 text-center">
        <p className="text-[11px] font-medium uppercase tracking-widest text-fog/70">
          {weekdayLabel}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-stone fa-num">{todayLabel}</p>
      </div>

      {/* بدنه بنر */}
      <div
        className="rounded-3xl border border-mist/40 px-6 py-7 text-center shadow-[0_2px_16px_rgba(155,180,199,0.10)]"
        style={{ background: "rgba(155,180,199,0.10)" }}
      >
        {/* آیکون */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-mist/20">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="6" y="4" width="4" height="16" rx="1.5" fill="currentColor" className="text-mist-deep" />
            <rect x="14" y="4" width="4" height="16" rx="1.5" fill="currentColor" className="text-mist-deep" />
          </svg>
        </div>

        <h2 className="text-base font-semibold text-ink">فریز فعال است</h2>
        <p className="mt-1 text-sm text-stone fa-num">
          تا {freeze.toDateLabel}
          {freeze.daysLeft > 1 && (
            <span className="mr-1 text-fog">
              ({toFaDigits(String(freeze.daysLeft))} روز دیگر)
            </span>
          )}
        </p>

        {freeze.note && (
          <p className="mt-3 rounded-xl bg-black/4 px-4 py-2.5 text-[12.5px] leading-relaxed text-stone">
            {freeze.note}
          </p>
        )}

        <p className="mt-4 text-[12px] leading-relaxed text-fog">
          در این بازه نیازی به ثبت تعهد نیست. این روزها نه‌گپ محاسبه می‌شوند.
        </p>

        {/* لغو فریز */}
        <div className="mt-5 flex items-center justify-center gap-2">
          {confirmCancel ? (
            <>
              <button
                type="button"
                onClick={cancelFreeze}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-full border border-ember/30 bg-ember/6 px-4 py-1.5 text-[12px] text-ember hover:bg-ember/10 disabled:opacity-40"
              >
                {isPending && <Spinner size={11} />}
                بله، لغو شود
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="rounded-full px-3 py-1.5 text-[12px] text-fog hover:bg-black/5"
              >
                نه
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="rounded-full px-3 py-1.5 text-[11px] text-fog/80 hover:text-stone hover:bg-black/5"
            >
              لغو زودهنگام فریز
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
