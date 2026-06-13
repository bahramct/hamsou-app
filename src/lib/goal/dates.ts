// ─────────────────────────────────────────────────────────────────────────────
// goal/dates.ts — منطقِ تاریخ و روزشماریِ فیچر «برنامه‌ریزی» (DECISION-082)
//
// قرارداد: همهٔ تاریخ‌های هدف/استوری «begin-of-day ایران» به‌صورت UTC midnight‌اند
// (مثل getTodayDateForDB). پس اجزای UTCِ این Dateها = همان روزِ تقویمیِ ایران.
// زمان «الان» از date.ts (که خود nowMs/time-travel را رعایت می‌کند) می‌آید.
// client-safe (فقط محاسبهٔ خالص؛ بدون prisma).
// ─────────────────────────────────────────────────────────────────────────────

import { getTodayDateForDB, nowInIran } from "@/lib/utils/date";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** «امروزِ ایران» به‌صورت UTC-midnight (همان مبنای ذخیرهٔ تاریخ‌های هدف). */
export function goalToday(): Date {
  return getTodayDateForDB();
}

/** کلیدِ روزِ ایران "YYYY-MM-DD" از یک Dateِ UTC-midnight-ایران. */
export function iranDayKey(dbDate: Date): string {
  const y = dbDate.getUTCFullYear();
  const m = String(dbDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dbDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** کلیدِ روزِ «امروزِ ایران». */
export function todayKey(): string {
  return iranDayKey(goalToday());
}

/** ساعتِ فعلیِ ایران به‌صورت "HH:mm" (با احترام به time-travel). */
export function iranClock(): string {
  const d = nowInIran();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** تعداد روزِ کلِ مسیر (شاملِ روزِ شروع و پایان). */
export function totalDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

/** روزِ k اُمِ مسیر برای «امروز» (۱-ایندکس). قبل از شروع → ≤۰. */
export function currentDayNumber(start: Date, ref: Date = goalToday()): number {
  return Math.floor((ref.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

/** روزهای ماندهٔ تا پایان (از امروز). صفر = امروز روزِ پایان است؛ منفی = گذشته. */
export function daysRemaining(end: Date, ref: Date = goalToday()): number {
  return Math.round((end.getTime() - ref.getTime()) / MS_PER_DAY);
}

export interface CompanionAvailability {
  /** آیا امروز (با توجه به بازه) «همراه» در دسترس است؟ (بدون لحاظِ پلن/مصرفِ امروز) */
  available: boolean;
  dayNumber: number;
  totalDays: number;
  /** دلیلِ عدم‌دسترسی برای پیامِ کاربر */
  reason?: "before_day_2" | "ended" | "last_day";
}

/**
 * قاعدهٔ ساختاریِ «همراه» (DECISION-082 — اصلاح‌شده):
 * از روزِ دوم به بعد، تا روزِ قبل از پایان (یعنی dayNumber در بازهٔ [۲, totalDays-۱]).
 * اهدافِ ۲ روزه همراه ندارند (روزِ ۱ = before, روزِ ۲ = last_day).
 */
export function companionWindow(start: Date, end: Date, ref: Date = goalToday()): CompanionAvailability {
  const total = totalDays(start, end);
  const day = currentDayNumber(start, ref);
  if (day < 2) return { available: false, dayNumber: day, totalDays: total, reason: "before_day_2" };
  if (day > total - 1) {
    // روزِ پایان یا بعد از آن
    return {
      available: false,
      dayNumber: day,
      totalDays: total,
      reason: day > total ? "ended" : "last_day",
    };
  }
  return { available: true, dayNumber: day, totalDays: total };
}
