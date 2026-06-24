// ─────────────────────────────────────────────────────────────────────────────
// theme — منطقِ مشترکِ تم (DECISION-067 → بازنگری در DECISION-128)
// سه تم: "light" | "dark" | "indigo". «system» حذف شد.
// ایندیگو (بنفش) فقط در اپ نمایش داده می‌شود؛ روی صفحاتِ پابلیک/ادمین به دارک تنزل
// می‌یابد (در سطحِ resolve، پس data-theme روی آن صفحات هرگز "indigo" نمی‌شود).
// مقدارِ resolved روی <html data-theme> می‌نشیند.
// ─────────────────────────────────────────────────────────────────────────────

export type ThemePref = "light" | "dark" | "indigo";

export const THEME_STORAGE_KEY = "hamsoo-theme";

// مسیرهایی که ایندیگو نمی‌گیرند (پابلیک + ادمین) → ایندیگو روی این‌ها = دارک.
// نکته: /plans و /story عمداً نیستند چون نسخهٔ اپ‌شان فقط برای کاربرِ لاگین‌کرده است
// (و فقط کاربرِ لاگین‌کرده می‌تواند ایندیگو را انتخاب کند).
const NO_INDIGO_PREFIXES = [
  "/about", "/contact", "/privacy", "/blog", "/b", "/terms", "/share",
  "/login", "/admin", "/forgot-password", "/reset-password", "/verify-email",
];

export function isNoIndigoPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return NO_INDIGO_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function readThemePref(): ThemePref {
  if (typeof window === "undefined") return "light";
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "indigo") return v;
  } catch {
    /* localStorage در دسترس نیست — light */
  }
  return "light";
}

export function resolveTheme(pref: ThemePref, pathname?: string): "light" | "dark" | "indigo" {
  if (pref === "indigo") {
    const path = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    return isNoIndigoPath(path) ? "dark" : "indigo";
  }
  return pref;
}

/** اعمالِ تم با گذارِ نرم — کلاسِ گذرای theme-anim حین تعویض. */
export function applyTheme(pref: ThemePref, pathname?: string, animate = true): void {
  const html = document.documentElement;
  if (animate) {
    html.classList.add("theme-anim");
    window.setTimeout(() => html.classList.remove("theme-anim"), 520);
  }
  html.setAttribute("data-theme", resolveTheme(pref, pathname));
}

export function saveThemePref(pref: ThemePref): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* بی‌صدا — تم فقط برای همین session اعمال می‌شود */
  }
}
