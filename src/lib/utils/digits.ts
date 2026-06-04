// ─────────────────────────────────────────────────────────────────────────────
// ابزار ارقام — قانون قطعی نمایش فارسی (DECISION-042)
//
// نمایش ارقام فارسی عمدتاً با فیچر فونت ss01 انجام می‌شود (روی body + فرم‌کنترل‌ها).
// اما برای ورودی‌های عددی که از type="number" به متنی تبدیل شده‌اند، باید مقدارِ
// تایپ/چسبانده‌شده را به ارقام لاتین نرمال کنیم تا parse عددی درست بماند.
// جهت (direction) همیشه LTR است — این فقط گلیف رقم را عوض می‌کند، نه ترتیب ریاضی.
// ─────────────────────────────────────────────────────────────────────────────

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** ارقام فارسی/عربی → لاتین (برای نرمال‌سازی ورودی پیش از parse). */
export function toEnDigits(input: string): string {
  let out = "";
  for (const ch of input) {
    const fa = FA_DIGITS.indexOf(ch);
    if (fa !== -1) { out += String(fa); continue; }
    const ar = AR_DIGITS.indexOf(ch);
    if (ar !== -1) { out += String(ar); continue; }
    out += ch;
  }
  return out;
}

/** فقط ارقام لاتین را نگه می‌دارد (نرمال‌سازی فارسی/عربی + حذف غیررقم). */
export function onlyDigits(input: string): string {
  return toEnDigits(input).replace(/[^0-9]/g, "");
}

/** ارقام لاتین → فارسی (برای نمایش تضمینی در مواردی که فونت کافی نیست). */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}
