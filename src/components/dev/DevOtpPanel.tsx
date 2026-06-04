"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DevOtpPanel — پنل dev برای نمایش کد OTP در صفحه login و auto-fill کردن آن.
//
// - فقط زمانی نمایش داده می‌شود که parent درون <DevOnly> رندرش کند.
// - حتی اگر کسی این کامپوننت را خارج از <DevOnly> استفاده کند، حلقه دفاعی
//   داخلی آن (`IS_DEV_MODE`) هم چک می‌شود تا در prod چیزی نشت نکند.
// - کد فقط زمانی کلیک‌پذیر است که از API برگشته باشد (یعنی request-otp انجام شده).
//
// لایه ۲ از معماری Dev/Prod (CLAUDE.md §۱۳).
// ─────────────────────────────────────────────────────────────────────────────

import { IS_DEV_MODE } from "@/lib/env";

type Props = {
  /** کد OTP که از پاسخ /api/auth/request-otp در حالت dev آمده */
  code: string | null;
  /** هنگام کلیک، کد را در فرم OTP قرار می‌دهد */
  onFill: (code: string) => void;
};

export function DevOtpPanel({ code, onFill }: Props) {
  // حلقه دفاعی دوم — حتی اگر این کامپوننت بیرون از <DevOnly> رندر شود، در prod
  // بسته نمی‌شود.
  if (!IS_DEV_MODE) return null;
  if (!code) return null;

  return (
    <div
      className="
        mt-4 rounded-xl border border-dashed border-ember/40
        bg-ember/5 px-4 py-3
        animate-fade-in
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] font-semibold tracking-wider text-ember">
            DEV ONLY — نمایش کد برای توسعه
          </span>
          <span
            className="text-lg font-semibold text-ink tracking-widest"
            dir="ltr"
          >
            {code}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onFill(code)}
          className="
            shrink-0 px-3 py-1.5 rounded-lg
            bg-ink text-paper text-xs font-medium
            hover:bg-charcoal active:scale-[0.98]
            transition-all duration-200
          "
        >
          پر کن
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-stone leading-relaxed">
        این پنل فقط در حالت توسعه دیده می‌شود. در پروداکشن کد فقط از طریق پیامک ارسال خواهد شد.
      </p>
    </div>
  );
}
