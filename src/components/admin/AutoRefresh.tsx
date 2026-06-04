"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AutoRefresh — polling سبک برای بروزرسانی Server Components در پنل ادمین
//
// هر intervalMs ثانیه router.refresh() صدا می‌زند تا داده‌های سرور (تیکت‌ها، چت‌ها)
// بدون نیاز به F5 یا خروج/ورود مجدد بروز شوند. فقط هنگامی که tab فعال است اجرا می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  intervalMs?: number;
}

export function AutoRefresh({ intervalMs = 10_000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (!document.hidden) router.refresh();
    };
    const t = setInterval(tick, intervalMs);
    // وقتی tab دوباره فعال شد فوری refresh کن
    const onVisible = () => { if (!document.hidden) router.refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, intervalMs]);

  return null;
}
