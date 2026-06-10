"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ThemeToggle — دکمهٔ چرخه‌ای تم: system → light → dark → system (DECISION-067)
// یک دکمهٔ گردِ آرام؛ آیکونِ ترجیحِ فعلی را نشان می‌دهد. بدون متن، بدون جشن.
// تغییرِ تم با گذارِ نرم (theme-anim) اعمال می‌شود؛ toggleِ «حالت» است نه اکشن
// — پس تغییرِ آیکون مجاز است (استثنای DECISION-053).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import {
  type ThemePref,
  readThemePref,
  applyTheme,
  saveThemePref,
} from "@/lib/theme";

const ORDER: ThemePref[] = ["system", "light", "dark"];

const LABELS: Record<ThemePref, string> = {
  system: "تم: هماهنگ با سیستم",
  light: "تم: روشن",
  dark: "تم: تاریک",
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

function AutoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* نیم‌خورشید/نیم‌ماه — حالت خودکار */}
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" opacity="0.45" />
    </svg>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  // تا mount، ترجیح را نمی‌دانیم (localStorage) — placeholder بدون آیکونِ قطعی
  const [pref, setPref] = useState<ThemePref | null>(null);

  useEffect(() => {
    setPref(readThemePref());
  }, []);

  // در حالتِ system، با تغییرِ تمِ سیستم‌عامل، زنده هماهنگ شو
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  function cycle() {
    const current = pref ?? "system";
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    setPref(next);
    saveThemePref(next);
    applyTheme(next);
  }

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
      {pref === "light" ? <SunIcon /> : pref === "dark" ? <MoonIcon /> : <AutoIcon />}
    </button>
  );
}
