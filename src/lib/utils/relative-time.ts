// ─────────────────────────────────────────────────────────────────────────────
// زمان نسبی فارسی — «۲ ساعت پیش» (DECISION-046)
// ارقام با toFaDigits (قانون قطعی ارقام فارسی، CLAUDE.md §۵). بیش از ۷ روز →
// تاریخ جلالی کامل (قانون قطعی تاریخ جلالی). جهت LTR برای عددها رعایت می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { toFaDigits } from "@/lib/utils/digits";

/** فاصلهٔ زمانی از اکنون به‌صورت متن فارسی نسبی. */
export function faRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Math.max(0, Date.now() - then);

  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "همین حالا";
  if (min < 60) return `${toFaDigits(min)} دقیقه پیش`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${toFaDigits(hr)} ساعت پیش`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${toFaDigits(day)} روز پیش`;

  // قدیمی‌تر از یک هفته → تاریخ جلالی کامل
  return new Date(iso).toLocaleDateString("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Tehran",
  });
}
