"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DevResetPanel — پنل ریست وضعیت کاربر در حالت توسعه
//
// هدف: شبیه‌سازی دو حالت برای تست جریان‌های مختلف، از هر صفحه‌ای از سایت:
//
//   ۱. «بازدیدکننده جدید»  — session cookie + localStorage پاک می‌شود → ریدایرکت به /
//   ۲. «سشن منقضی»        — فقط session cookie پاک می‌شود (localStorage دست‌نخورده) → به /login
//                            شبیه‌سازی کاربری که داده دارد ولی session او منقضی شده
//
// نکات پیاده‌سازی:
// - Cookie از نوع httpOnly است و JavaScript نمی‌تواند مستقیماً آن را حذف کند.
//   بنابراین از API Route موجود (POST /api/auth/logout) برای حذف cookie استفاده می‌کنیم.
// - پس از ریست، از window.location.href استفاده می‌کنیم (نه router.push) تا page کاملاً
//   reload شود و Middleware دوباره ارزیابی کند — اطمینان از صحت وضعیت auth.
//
// این لایه ۲ از معماری Dev/Prod است (CLAUDE.md §۱۳).
// در production: IS_DEV_MODE = false → null برمی‌گرداند.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { IS_DEV_MODE } from "@/lib/env";

type ResetMode = "fresh" | "expired";

export function DevResetPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // حلقه دفاعی — در prod اصلاً رندر نمی‌شود
  if (!IS_DEV_MODE) return null;

  async function handleReset(mode: ResetMode) {
    setLoading(true);
    setOpen(false);

    try {
      // ۱. پاک کردن session cookie از طریق API (httpOnly — فقط سرور می‌تواند آن را بسازد/حذف کند)
      await fetch("/api/auth/logout", { method: "POST" });

      // ۲. بر اساس حالت انتخابی، localStorage را مدیریت می‌کنیم
      if (mode === "fresh") {
        // بازدیدکننده کاملاً جدید — همه داده‌های client-side پاک می‌شوند
        try { localStorage.clear(); } catch { /* در برخی مرورگرها ممکن است fail شود */ }
        try { sessionStorage.clear(); } catch { /* در برخی مرورگرها ممکن است fail شود */ }
      }
      // در حالت "expired": localStorage دست نمی‌خورد — شبیه‌سازی کاربری با داده اما بدون session

      // ۳. ریدایرکت با hard reload — اطمینان از ارزیابی مجدد Middleware و پاک‌سازی کش Next.js
      const target = mode === "fresh" ? "/" : "/login";
      window.location.href = target;
    } catch {
      // در صورت خطا، دستی هدایت می‌کنیم
      setLoading(false);
      window.location.reload();
    }
  }

  return (
    <div className="hidden md:block fixed bottom-3 z-50" style={{ left: "52px" }}>
      {/* دکمه toggle */}
      <button
        type="button"
        aria-label="Dev Reset Panel"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="
          flex items-center justify-center w-7 h-7 rounded-md
          bg-ember/90 text-paper
          shadow-paper-sm
          hover:bg-ember active:scale-95
          transition-all duration-200
          disabled:opacity-50
        "
        title="ریست وضعیت (Dev Only)"
      >
        {loading ? (
          /* spinner */
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74" />
          </svg>
        ) : (
          /* ikon ریست */
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74" />
            <path d="M3 3v4h4" />
          </svg>
        )}
      </button>

      {/* پنل dropdown — باز می‌شود به بالا */}
      {open && (
        <div
          className="
            absolute bottom-9 left-0
            w-56 rounded-xl
            bg-ember/95 text-paper
            shadow-paper-md
            overflow-hidden
            animate-fade-in
          "
          dir="rtl"
        >
          {/* عنوان */}
          <div className="px-3 pt-3 pb-2 border-b border-white/15">
            <p className="text-[10px] font-semibold tracking-wider opacity-70">DEV — ریست وضعیت</p>
          </div>

          {/* گزینه ۱ — بازدیدکننده جدید */}
          <button
            type="button"
            onClick={() => handleReset("fresh")}
            className="
              w-full px-3 py-3 text-right
              hover:bg-white/15 active:bg-white/25
              transition-colors duration-150
              border-b border-white/10
            "
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🆕</span>
              <div>
                <p className="text-xs font-medium">بازدیدکننده جدید</p>
                <p className="text-[10px] opacity-65 mt-0.5 leading-snug">session + localStorage پاک می‌شود</p>
              </div>
            </div>
          </button>

          {/* گزینه ۲ — سشن منقضی */}
          <button
            type="button"
            onClick={() => handleReset("expired")}
            className="
              w-full px-3 py-3 text-right
              hover:bg-white/15 active:bg-white/25
              transition-colors duration-150
            "
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              <div>
                <p className="text-xs font-medium">سشن منقضی</p>
                <p className="text-[10px] opacity-65 mt-0.5 leading-snug">فقط cookie پاک می‌شود، داده باقی است</p>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
