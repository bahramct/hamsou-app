"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ServiceWorkerRegistrar — ثبتِ /sw.js برای نصب‌پذیریِ PWA (DECISION-121).
//
// فقط در حالتِ production (IS_PROD_MODE، منبعِ حقیقتِ §۱۳ CLAUDE.md) ثبت می‌شود —
// تا در dev، SW داراییِ Turbopack را cache نکند و باعثِ کهنگیِ آزاردهنده نشود.
// در dev اصلاً ثبت نمی‌شود؛ اگر SWِ قبلی‌ای مانده باشد، unregister می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { IS_PROD_MODE } from "@/lib/env";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    if (!IS_PROD_MODE) {
      // در dev: مطمئن شو SWی فعال نمانده (که کشِ کهنه بدهد)
      navigator.serviceWorker.getRegistrations?.().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* بی‌صدا — نبودِ SW اپ را نمی‌شکند */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
