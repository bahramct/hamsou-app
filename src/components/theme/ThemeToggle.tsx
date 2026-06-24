"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ThemeToggle — دکمهٔ چرخه‌ای تم (DECISION-128)
//   اپ (allowIndigo):   light → dark → indigo
//   پابلیک/ادمین:        light → dark   (بدونِ ایندیگو)
// «system» حذف شد. toggleِ «حالت» است (تغییرِ آیکون مجاز — استثنای DECISION-053).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  type ThemePref,
  readThemePref,
  applyTheme,
  saveThemePref,
} from "@/lib/theme";

const LABELS: Record<ThemePref, string> = {
  light: "تم: روشن",
  dark: "تم: تاریک",
  indigo: "تم: ایندیگو",
};

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
function IndigoIcon() {
  // قطرهٔ نیمه‌پر — اشاره به تمِ بنفش (بدون متن)
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3c3.5 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2.5-6 6-10z" />
      <path d="M12 3c3.5 4 6 7 6 10a6 6 0 0 1-6 6z" fill="currentColor" stroke="none" opacity="0.45" />
    </svg>
  );
}

export function ThemeToggle({
  className = "",
  allowIndigo = false,
}: {
  className?: string;
  allowIndigo?: boolean;
}) {
  const pathname = usePathname();
  const [pref, setPref] = useState<ThemePref | null>(null);

  useEffect(() => {
    setPref(readThemePref());
  }, []);

  const ORDER: ThemePref[] = allowIndigo ? ["light", "dark", "indigo"] : ["light", "dark"];

  function cycle() {
    let current = pref ?? "light";
    if (!ORDER.includes(current)) current = "light"; // ایندیگوی ذخیره‌شده روی تاگلِ ۲تایی
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    setPref(next);
    saveThemePref(next);
    applyTheme(next, pathname);
  }

  // آیکونِ نمایش‌داده‌شده = تمِ مؤثر (ایندیگو روی جایی که مجاز نیست = تاریک)
  const shown: ThemePref = pref === "indigo" && !allowIndigo ? "dark" : (pref ?? "light");
  const label = pref ? LABELS[pref] : "تم";

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full
        text-stone hover:text-ink
        border border-black/8 hover:border-black/14
        bg-white/40 hover:bg-white/70
        transition-all duration-300 ${className}`}
    >
      {shown === "light" ? <SunIcon /> : shown === "indigo" ? <IndigoIcon /> : <MoonIcon />}
    </button>
  );
}
