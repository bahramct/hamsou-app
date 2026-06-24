"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ThemeRouteSync — با تغییرِ مسیر (ناوبریِ کلاینت)، تمِ مؤثر را دوباره resolve می‌کند.
// لازم چون ThemeScript فقط در لودِ کامل اجرا می‌شود؛ هنگام رفتن از اپ (ایندیگو) به یک
// صفحهٔ پابلیک، باید به دارک تنزل یابد و برعکس هنگام بازگشت به اپ. (DECISION-128)
// animate=false تا هنگامِ ناوبری گذارِ اضافه دیده نشود.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { readThemePref, applyTheme } from "@/lib/theme";

export function ThemeRouteSync() {
  const pathname = usePathname();
  useEffect(() => {
    applyTheme(readThemePref(), pathname, false);
  }, [pathname]);
  return null;
}
