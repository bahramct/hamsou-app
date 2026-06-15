"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GoalDeleteModal — حذف یا رهاکردنِ هدف (DECISION-082)
// دو گزینه:
//   ۱. «در تاریخچه بماند» — status = abandoned (همهٔ دیتا حفظ می‌شود)
//   ۲. «کلاً حذف شود» — DELETE (cascade — هیچ‌چیز نمی‌ماند)
// متن دکمه ثابت + Spinner + toast (DECISION-053).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { Portal } from "@/components/ui/Portal";
import { toast } from "@/lib/notifications/toast";

type DeleteChoice = "keep" | "purge" | null;

export function GoalDeleteModal({
  goalId,
  goalTitle,
  onClose,
}: {
  goalId: string;
  goalTitle: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [choice, setChoice] = useState<DeleteChoice>(null);
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

  function handleConfirm() {
    if (!choice || isPending) return;
    startTransition(async () => {
      try {
        let res: Response;
        if (choice === "keep") {
          res = await fetch(`/api/goal/${goalId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "abandon" }),
          });
        } else {
          res = await fetch(`/api/goal/${goalId}`, { method: "DELETE" });
        }
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success(choice === "keep" ? "هدف در تاریخچه نگه داشته شد" : "هدف کاملاً حذف شد");
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
        aria-label="حذف هدف"
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
            <h2 className="text-sm font-semibold text-ink">پایانِ مسیر</h2>
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

          <div className="px-5 py-5">
            <p className="mb-1 text-[13px] leading-relaxed text-stone">
              می‌خواهی مسیرِ «<span className="font-medium text-ink">{goalTitle}</span>» را ببندی؟
            </p>
            <p className="mb-5 text-[12px] leading-relaxed text-fog">
              انتخاب کن چه اتفاقی بیفتد:
            </p>

            {/* گزینه ۱: نگه‌داری */}
            <button
              type="button"
              onClick={() => setChoice("keep")}
              className={`mb-3 w-full rounded-2xl border p-4 text-right transition-all ${
                choice === "keep"
                  ? "border-stone/40 bg-black/4 ring-1 ring-stone/20"
                  : "border-bone bg-white/50 hover:border-stone/25"
              }`}
            >
              <p className="text-[13px] font-medium text-ink">در تاریخچه بماند</p>
              <p className="mt-1 text-[11px] leading-relaxed text-fog">
                همهٔ استوری‌ها و دیتای مسیر حفظ می‌شوند — فقط با برچسبِ «رها شده».
              </p>
            </button>

            {/* گزینه ۲: حذفِ کامل */}
            <button
              type="button"
              onClick={() => setChoice("purge")}
              className={`w-full rounded-2xl border p-4 text-right transition-all ${
                choice === "purge"
                  ? "border-ember/40 bg-ember/5 ring-1 ring-ember/20"
                  : "border-bone bg-white/50 hover:border-ember/25"
              }`}
            >
              <p className={`text-[13px] font-medium ${choice === "purge" ? "text-ember" : "text-stone"}`}>
                کلاً حذف شود
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-fog">
                هیچ اثری از این هدف و استوری‌هایش نمی‌ماند.
              </p>
            </button>
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
              onClick={handleConfirm}
              disabled={!choice || isPending}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-paper transition-colors disabled:opacity-40 ${
                choice === "purge" ? "bg-ember hover:bg-ember/85" : "bg-stone hover:bg-ink"
              }`}
            >
              {isPending && <Spinner size={13} />}
              تأیید
            </button>
          </div>
        </div>
      </div>
    </>
    </Portal>
  );
}
