"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FreezeModal — ایجاد فریز پیشگیرانه (DECISION-083)
// الگوی مودال: fixed inset-0، مرکز کامل صفحه، بدون اسکرول‌بار داخلی.
// متنِ دکمه ثابت + Spinner + toast (DECISION-053).
//
// از <Portal> رندر می‌شود تا از containing-block‌های transform-دارِ والد فرار کند
// (EntryForm با animate-fade-up یک transform دائمی نگه می‌داشت و مودال را در کادرِ
// max-w-lg حبس می‌کرد) — DECISION-085.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { JalaliDatePicker } from "@/components/ui/JalaliDatePicker";
import { Portal } from "@/components/ui/Portal";
import { toast } from "@/lib/notifications/toast";
import { toFaDigits } from "@/lib/utils/digits";
import { getTodayISO } from "@/lib/utils/date-client";

const MAX_NOTE = 300;

export function FreezeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [fromIso, setFromIso] = useState<string>(getTodayISO());
  const [toIso, setToIso] = useState<string>("");
  const [note, setNote] = useState("");
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
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  function submit() {
    if (!toIso || isPending) return;
    if (toIso <= fromIso) {
      toast.error("تاریخ پایان باید بعد از تاریخ شروع باشد");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/freeze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromIso, toIso, note: note.trim() || undefined }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success("فریز ثبت شد");
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

  return (
    <Portal>
      {/* پس‌زمینه */}
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

      {/* مودال */}
      <div
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-5"
        role="dialog"
        aria-modal="true"
        aria-label="فریز کردن تعهدات"
      >
        <div
          className="pointer-events-auto w-full max-w-md max-h-[calc(100dvh-2.5rem)] overflow-y-auto rounded-3xl border border-black/8 shadow-[0_20px_60px_rgba(26,26,31,0.18),0_0_0_1px_rgba(255,255,255,0.5)_inset]"
          style={{
            background: "rgba(var(--rgb-paper),0.96)",
            backdropFilter: "blur(28px) saturate(150%)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.94)",
            transition: "opacity 220ms ease, transform 280ms cubic-bezier(0.19,1,0.22,1)",
          }}
        >
          {/* هدر */}
          <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">فریز کردن تعهدات</h2>
              <p className="text-[11px] text-fog mt-0.5">
                روزهای فریز نه‌گپ محاسبه می‌شوند، نه تعهد.
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="بستن"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/6 hover:bg-black/10"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* محتوا — اسکرول‌پذیر (بدون نمایش اسکرول‌بار) تا تقویمِ inline درونِ کادر جا شود */}
          <div className="space-y-4 px-5 py-5 max-h-[62vh] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden scrollbar-none">
            {/* توضیح */}
            <p className="text-[13px] leading-relaxed text-stone">
              در این بازه نیازی به ثبت تعهد نیست. روزها به‌عنوان فریز (نه گپ)
              ثبت می‌شوند و در گزارش هفتگی جداگانه دیده می‌شوند.
            </p>

            {/* بازه تاریخ — عمودی تا تقویمِ تمام‌عرضِ inline درونِ مودال باز شود */}
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-medium text-stone">از تاریخ</p>
                <JalaliDatePicker
                  inline
                  value={fromIso}
                  onChange={setFromIso}
                  placeholder="شروع فریز"
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-stone">تا تاریخ</p>
                <JalaliDatePicker
                  inline
                  value={toIso}
                  onChange={setToIso}
                  placeholder="پایان فریز"
                />
              </div>
            </div>

            {/* دلیل اختیاری */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-stone">
                دلیل <span className="text-fog font-normal">(اختیاری)</span>
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(toFaDigits(e.target.value).slice(0, MAX_NOTE))}
                rows={2}
                dir="rtl"
                placeholder="مثلاً: مسافرت، امتحانات، یا هر دلیل دیگری…"
                className="w-full resize-none rounded-xl border border-bone bg-white/50 p-3 text-[13px] leading-relaxed text-ink placeholder:text-fog/70 focus:outline-none"
              />
              {note.length > MAX_NOTE * 0.8 && (
                <p className="mt-1 text-right text-[10px] text-fog fa-num">
                  {(MAX_NOTE - note.length).toLocaleString("fa-IR")} کاراکتر مانده
                </p>
              )}
            </div>
          </div>

          {/* فوتر */}
          <div className="flex items-center justify-end gap-2 border-t border-black/6 px-5 py-3.5">
            <button
              type="button"
              onClick={close}
              className="rounded-full px-4 py-2 text-sm text-stone hover:bg-black/5"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={isPending || !toIso}
              className="flex items-center gap-2 rounded-full bg-mist-deep px-5 py-2 text-sm font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-40"
            >
              {isPending && <Spinner size={13} />}
              فریز کردن
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
