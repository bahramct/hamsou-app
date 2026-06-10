// ─────────────────────────────────────────────────────────────────────────────
// theme — منطقِ مشترکِ تمِ روشن/تاریک (DECISION-067)
// ترجیح کاربر: "light" | "dark" | "system" — در localStorage ذخیره می‌شود.
// مقدارِ resolved ("light" | "dark") روی <html data-theme> می‌نشیند.
// ─────────────────────────────────────────────────────────────────────────────

export type ThemePref = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "hamsoo-theme";

export function readThemePref(): ThemePref {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage در دسترس نیست — system */
  }
  return "system";
}

export function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref === "light" || pref === "dark") return pref;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** اعمالِ تم با گذارِ نرم — کلاسِ گذرای theme-anim حین تعویض. */
export function applyTheme(pref: ThemePref, animate = true): void {
  const html = document.documentElement;
  if (animate) {
    html.classList.add("theme-anim");
    window.setTimeout(() => html.classList.remove("theme-anim"), 520);
  }
  html.setAttribute("data-theme", resolveTheme(pref));
}

export function saveThemePref(pref: ThemePref): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* بی‌صدا — تم فقط برای همین session اعمال می‌شود */
  }
}
