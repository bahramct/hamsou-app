"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ToastHost — رندر سراسری toastها (DECISION-046)
// در layout ریشه نصب می‌شود → روی سایت و پنل ادمین کار می‌کند.
// تنِ مانیفستی: کارت سفیدِ آرام، یک نوار لهجه‌ای کنار، بدون ایموجی/جشن.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useToastStore, type ToastItem, type ToastTone } from "@/lib/notifications/toast";

const TONE: Record<ToastTone, { accent: string; dot: string }> = {
  success: { accent: "border-r-sage", dot: "bg-sage" },
  error: { accent: "border-r-ember", dot: "bg-ember" },
  info: { accent: "border-r-stone", dot: "bg-stone" },
  neutral: { accent: "border-r-fog", dot: "bg-fog" },
};

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      className="fixed bottom-6 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastRow key={t.id} item={t} />
      ))}
    </div>
  );
}

function ToastRow({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const [shown, setShown] = useState(false);
  const tone = TONE[item.tone];

  useEffect(() => {
    // ورود نرم در فریم بعد
    const raf = requestAnimationFrame(() => setShown(true));
    // حذف خودکار پس از duration
    const timer = setTimeout(() => {
      setShown(false);
      setTimeout(() => dismiss(item.id), 220); // پس از پایان انیمیشن خروج
    }, item.duration);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [item.id, item.duration, dismiss]);

  return (
    <div
      className={`
        pointer-events-auto w-full max-w-sm flex items-center gap-2.5
        rounded-xl bg-white border border-black/8 ${tone.accent} border-r-2
        px-4 py-3 shadow-lg shadow-black/5
        transition-all duration-200 ease-out
        ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      role="status"
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tone.dot}`} aria-hidden />
      <p className="text-sm text-ink leading-relaxed flex-1">{item.message}</p>
      <button
        onClick={() => {
          setShown(false);
          setTimeout(() => dismiss(item.id), 220);
        }}
        className="text-fog hover:text-stone transition-colors text-lg leading-none shrink-0"
        aria-label="بستن"
      >
        ×
      </button>
    </div>
  );
}
