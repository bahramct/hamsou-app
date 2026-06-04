// ─────────────────────────────────────────────────────────────────────────────
// date.ts — ابزارهای تاریخ برای همسو
//
// ● تقویم شمسی (جلالی) با jalaali-js (DECISION-019)
// ● Timezone ایران: UTC+3:30 — بدون DST (fail-safe برای MVP)
//   اگر در آینده DST لازم شد، این فایل تنها جایی است که باید تغییر کند.
// ● این فایل برای هر دو محیط server و client safe است.
//   فقط canEdit و editTimeRemaining در Client Components استفاده می‌شوند.
// ● زمان «الان» از getNow() / nowMs() گرفته می‌شود — نه new Date()/Date.now() —
//   تا time-travel در dev کار کند (DECISION-021).
// ─────────────────────────────────────────────────────────────────────────────

import jalaali from "jalaali-js";
import { nowMs } from "@/lib/dev/time";

/** اختلاف زمانی ایران با UTC — 3 ساعت و 30 دقیقه */
const IRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// توابع Timezone
// ─────────────────────────────────────────────────────────────────────────────

/** زمان فعلی در ایران (بدون تغییر timezone سیستم) */
export function nowInIran(): Date {
  return new Date(nowMs() + IRAN_OFFSET_MS);
}

/**
 * تاریخ «امروز ایران» به‌صورت UTC midnight برای ذخیره در DB.
 * مثال: اگر ایران ۱۴ اردیبهشت ۱۴۰۳ باشد:
 *   → Date object معادل UTC 2024-05-03 00:00:00.000Z
 *
 * چرا این رویکرد؟
 * SQLite با UTC کار می‌کند. برای unique constraint روز (userId + date)
 * باید همه کاربران ایرانی در یک روز شمسی، دقیقاً یک مقدار یکسان در `date` داشته باشند.
 * تبدیل به UTC midnight روز میلادی متناظر با روز ایرانی این تضمین را می‌دهد.
 */
export function getTodayDateForDB(): Date {
  const iran = nowInIran();
  return new Date(Date.UTC(
    iran.getUTCFullYear(),
    iran.getUTCMonth(),
    iran.getUTCDate(),
  ));
}

// ─────────────────────────────────────────────────────────────────────────────
// فرمت‌بندی برای نمایش
// ─────────────────────────────────────────────────────────────────────────────

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند",
] as const;

/** تبدیل عدد به رقم فارسی */
function toFa(n: number): string {
  return n.toLocaleString("fa-IR");
}

/**
 * نمایش شمسی تاریخ — مثال: «۲۶ اردیبهشت ۱۴۰۳»
 */
export function formatJalali(date: Date): string {
  // تبدیل به زمان ایران برای خواندن سال/ماه/روز صحیح
  const d = new Date(date.getTime() + IRAN_OFFSET_MS);
  const { jy, jm, jd } = jalaali.toJalaali(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
  );
  return `${toFa(jd)} ${JALALI_MONTHS[jm - 1]} ${toFa(jy)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// کمک‌توابع تاریخ‌گزین جلالی (DECISION-044)
// قاعده: مقدار ذخیره/تبادل همان «yyyy-mm-dd» میلادی است (سازگار با type=date و
// downstreamها)، اما کاربر همیشه شمسی می‌بیند. این توابع تاریخِ «تقویمیِ ساده» را
// بدون دخالت timezone تبدیل می‌کنند (نه از Date object — تا شیفت TZ رخ ندهد).
// ─────────────────────────────────────────────────────────────────────────────

export const JALALI_MONTH_NAMES = JALALI_MONTHS;
/** سرستون‌های هفته از شنبه (مطابق تقویم ایران) */
export const JALALI_WEEKDAY_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

export interface JalaliParts { jy: number; jm: number; jd: number; }

/** «yyyy-mm-dd» میلادی → اجزای جلالی. ورودی نامعتبر → null. */
export function isoToJalaliParts(iso: string): JalaliParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const gy = Number(m[1]), gm = Number(m[2]), gd = Number(m[3]);
  const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd);
  return { jy, jm, jd };
}

/** اجزای جلالی → «yyyy-mm-dd» میلادی (با padding). */
export function jalaliPartsToISO(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${gy}-${p(gm)}-${p(gd)}`;
}

/** نمایش شمسی از «yyyy-mm-dd» — مثال: «۱۰ خرداد ۱۴۰۵». نامعتبر → رشتهٔ خالی. */
export function formatJalaliFromISO(iso: string): string {
  const parts = isoToJalaliParts(iso);
  if (!parts) return "";
  return `${toFa(parts.jd)} ${JALALI_MONTHS[parts.jm - 1]} ${toFa(parts.jy)}`;
}

/** طول ماه جلالی (با احتساب سال کبیسه). */
export function jalaaliMonthLength(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

/**
 * شمارهٔ ستونِ اولین روزِ ماه در هفتهٔ شنبه‌محور (۰=شنبه … ۶=جمعه).
 * از روز هفتهٔ میلادیِ متناظر محاسبه می‌شود.
 */
export function jalaliMonthFirstWeekday(jy: number, jm: number): number {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, 1);
  const jsDay = new Date(gy, gm - 1, gd).getDay(); // 0=یکشنبه … 6=شنبه
  return (jsDay + 1) % 7; // شنبه→۰
}

/** اجزای جلالیِ «امروزِ ایران» (با احترام به time-travel در dev). */
export function jalaaliTodayParts(): JalaliParts {
  const d = nowInIran();
  const { jy, jm, jd } = jalaali.toJalaali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  return { jy, jm, jd };
}

/**
 * نمایش روز هفته — مثال: «سه‌شنبه»
 * getUTCDay: 0=یکشنبه ۱=دوشنبه ۲=سه‌شنبه ۳=چهارشنبه ۴=پنجشنبه ۵=جمعه ۶=شنبه
 */
export function formatWeekday(date: Date): string {
  const d = new Date(date.getTime() + IRAN_OFFSET_MS);
  const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
  return WEEKDAYS[d.getUTCDay()];
}

// ─────────────────────────────────────────────────────────────────────────────
// بازه هفته شمسی — برای گزارش هفتگی (TASK-009)
// قرارداد: هفته از شنبه شروع می‌شود (مطابق تقویم ایرانی)
// ─────────────────────────────────────────────────────────────────────────────

export interface JalaliWeekRange {
  /** UTC midnight روز شنبه ایران */
  weekStart: Date;
  /** UTC midnight روز جمعه ایران (۶ روز بعد از شنبه) */
  weekEnd: Date;
  /** نمایش شمسی شنبه — مثلاً «۲۲ اردیبهشت ۱۴۰۵» */
  jalaliStart: string;
  /** نمایش شمسی جمعه */
  jalaliEnd: string;
}

/**
 * بازه هفته شمسی شامل refDate.
 * شنبه → جمعه. weekStart = آخرین شنبه تا و شامل refDate.
 */
export function getJalaaliWeekRange(refDate: Date): JalaliWeekRange {
  // تبدیل به wall-time ایران
  const iran = new Date(refDate.getTime() + IRAN_OFFSET_MS);
  const dayOfWeek = iran.getUTCDay(); // 0=یک‌شنبه ... 6=شنبه
  // تعداد روز از شنبه گذشته (یا خود امروز اگر شنبه است)
  const daysSinceSaturday = (dayOfWeek + 1) % 7;

  const startUTC = new Date(
    Date.UTC(
      iran.getUTCFullYear(),
      iran.getUTCMonth(),
      iran.getUTCDate() - daysSinceSaturday
    )
  );
  const endUTC = new Date(
    Date.UTC(
      iran.getUTCFullYear(),
      iran.getUTCMonth(),
      iran.getUTCDate() - daysSinceSaturday + 6
    )
  );

  return {
    weekStart: startUTC,
    weekEnd: endUTC,
    jalaliStart: formatJalali(startUTC),
    jalaliEnd: formatJalali(endUTC),
  };
}

/**
 * هفته کامل قبلی (شنبه قبل تا جمعه قبل).
 * ساده‌ترین raison d'être: گزارش «هفته گذشته».
 */
export function getLastCompletedWeekRange(): JalaliWeekRange {
  const oneWeekAgo = new Date(nowMs() - 7 * 24 * 60 * 60 * 1000);
  return getJalaaliWeekRange(oneWeekAgo);
}

/** بازه هفته جاری (شنبه این هفته تا جمعه این هفته) */
export function getCurrentWeekRange(): JalaliWeekRange {
  return getJalaaliWeekRange(new Date(nowMs()));
}

// ─────────────────────────────────────────────────────────────────────────────
// منطق ویرایش تعهد — قابل استفاده در هر دو محیط (client-safe)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * آیا هنوز در بازه ویرایش هستیم؟
 * @param editableUntil — تاریخ پایان بازه ویرایش (Date یا ISO string)
 */
export function canEdit(editableUntil: Date | string): boolean {
  const until = editableUntil instanceof Date ? editableUntil : new Date(editableUntil);
  return nowMs() < until.getTime();
}

/**
 * زمان باقی‌مانده تا قفل شدن — فرمت فارسی برای نمایش به کاربر
 * مثال: «۱ ساعت و ۴۵ دقیقه» | «۳۰ دقیقه» | «قفل شد»
 */
export function editTimeRemaining(editableUntil: Date | string): string {
  const until = editableUntil instanceof Date ? editableUntil : new Date(editableUntil);
  const ms = until.getTime() - nowMs();
  if (ms <= 0) return "قفل شد";

  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0)
    return `${toFa(hours)} ساعت و ${toFa(minutes)} دقیقه`;
  if (hours > 0)
    return `${toFa(hours)} ساعت`;
  return `${toFa(minutes)} دقیقه`;
}
