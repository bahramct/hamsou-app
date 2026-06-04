// ─────────────────────────────────────────────────────────────────────────────
// dev/seed.ts — توابع تولید داده تستی برای dev
//
// این فایل server-only است. در Client Components import نکن.
// همه توابع با IS_DEV_MODE guard شروع می‌شوند — در prod استثنا پرتاب می‌شود.
//
// اصل: همه داده‌های ساخته‌شده با devSeed: true علامت می‌خورند تا
//      از داده واقعی کاربر قابل تمایز باشند و در reset حذف شوند. (DECISION-021)
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { IS_DEV_MODE } from "@/lib/env";
import { getNow } from "@/lib/dev/time";

// ────────── ثابت‌های محلی ──────────

const IRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
const ENTRY_EDIT_WINDOW_MS = 2 * 60 * 60 * 1000; // ۲ ساعت
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** متن‌های تعهد روزانه برای seed — متنوع و واقعی‌نما */
const SEED_CONTENTS = [
  "امروز ۳۰ دقیقه کتاب می‌خوانم",
  "یک ساعت روی پروژه شخصی کار می‌کنم",
  "با یک نفر تماس می‌گیرم که مدتی ندیده‌ام",
  "امروز ۲۰ دقیقه پیاده‌روی می‌کنم",
  "یک وظیفه عقب‌افتاده را انجام می‌دهم",
  "امروز یادداشت‌های هفته گذشته را مرور می‌کنم",
  "نیم ساعت مدیتیشن یا تنفس عمیق",
  "یک فصل از کتاب صوتی گوش می‌دهم",
  "محیط کار و مطالعه‌ام را مرتب می‌کنم",
  "امروز ۳ لیوان آب بیشتر از معمول می‌نوشم",
  "یک ایمیل یا پیام معوق‌مانده را می‌فرستم",
  "۱۵ دقیقه کشش و حرکات آرامش‌بخش",
  "فهرست اولویت‌های هفته را می‌نویسم",
  "یک کار کوچک خانگی که جا مانده را انجام می‌دهم",
];

// ────────── helpers ──────────

/** تاریخ یک روز خاص برای ذخیره در DB (UTC midnight معادل روز ایرانی) */
function getDateForDB(baseMs: number, daysAgo: number): Date {
  const targetMs = baseMs - daysAgo * MS_PER_DAY;
  const iranDate = new Date(targetMs + IRAN_OFFSET_MS);
  return new Date(
    Date.UTC(iranDate.getUTCFullYear(), iranDate.getUTCMonth(), iranDate.getUTCDate())
  );
}

/** زمان شبیه‌سازی‌شده ساخت تعهد (ساعت ۹ صبح آن روز ایران) */
function getCreatedAtForDay(baseMs: number, daysAgo: number): Date {
  const dayDate = getDateForDB(baseMs, daysAgo);
  // ۹ صبح ایران = UTC 5:30
  return new Date(dayDate.getTime() + 5.5 * 60 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// ۱. Seed Entries — ثبت تعهدهای گذشته
// ─────────────────────────────────────────────────────────────────────────────

export interface SeedEntriesResult {
  created: number;
  skipped: number;
  entryIds: string[];
}

/**
 * تعهدهای روزانه گذشته برای کاربر جاری seed می‌کند.
 * @param userId — شناسه کاربر جاری
 * @param days — تعداد روزهای گذشته (پیش‌فرض ۷)
 * @param skipToday — آیا امروز را رد کنیم؟ (پیش‌فرض true)
 */
export async function seedEntries(
  userId: string,
  days: number = 7,
  skipToday: boolean = true
): Promise<SeedEntriesResult> {
  if (!IS_DEV_MODE) throw new Error("seedEntries فقط در dev مجاز است");

  const nowMs = getNow().getTime();
  let created = 0;
  let skipped = 0;
  const entryIds: string[] = [];

  const startDay = skipToday ? 1 : 0;
  const endDay = skipToday ? days : days - 1;

  for (let i = startDay; i <= endDay; i++) {
    const date = getDateForDB(nowMs, i);
    const createdAt = getCreatedAtForDay(nowMs, i);
    const editableUntil = new Date(createdAt.getTime() + ENTRY_EDIT_WINDOW_MS);

    // اگر تعهد این روز قبلاً وجود داشت → رد کن
    const existing = await prisma.dailyEntry.findUnique({
      where: { userId_date: { userId, date } },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const entry = await prisma.dailyEntry.create({
      data: {
        userId,
        content: SEED_CONTENTS[(i - 1) % SEED_CONTENTS.length],
        date,
        createdAt,
        editableUntil,
        isLocked: true, // همه تعهدهای گذشته seed‌شده قفل هستند
        devSeed: true,
      },
    });

    entryIds.push(entry.id);
    created++;
  }

  return { created, skipped, entryIds };
}

// ─────────────────────────────────────────────────────────────────────────────
// ۲. Seed Feedback — بازخورد برای تعهدهای بدون بازخورد
// ─────────────────────────────────────────────────────────────────────────────

export interface SeedFeedbackResult {
  created: number;
  skipped: number;
  feedbackIds: string[];
}

/**
 * به تعهدهای بدون بازخورد کاربر، بازخورد seed می‌کند.
 * @param userId — شناسه کاربر جاری
 * @param coverage — درصد تعهدها که بازخورد می‌گیرند (۰ تا ۱، پیش‌فرض ۰.۸)
 * @param doneRatio — درصد DONE از بین بازخوردهای ساخته‌شده (پیش‌فرض ۰.۷)
 */
export async function seedFeedback(
  userId: string,
  coverage: number = 0.8,
  doneRatio: number = 0.7
): Promise<SeedFeedbackResult> {
  if (!IS_DEV_MODE) throw new Error("seedFeedback فقط در dev مجاز است");

  // تعهدهای کاربر که بازخورد ندارند
  const entriesWithoutFeedback = await prisma.dailyEntry.findMany({
    where: { userId, feedback: null },
    orderBy: { date: "asc" },
    select: { id: true },
  });

  const count = Math.round(entriesWithoutFeedback.length * coverage);
  const candidates = entriesWithoutFeedback.slice(0, count);

  let created = 0;
  const feedbackIds: string[] = [];

  for (let idx = 0; idx < candidates.length; idx++) {
    const entry = candidates[idx];
    // isDone بر اساس doneRatio — به‌صورت alternating برای قابلیت تکرار
    const isDone = idx / candidates.length < doneRatio;

    const feedback = await prisma.entryFeedback.create({
      data: {
        entryId: entry.id,
        status: isDone ? "DONE" : "NOT_DONE",
        note: isDone ? null : "حوصله نداشتم",
        devSeed: true,
      },
    });

    feedbackIds.push(feedback.id);
    created++;
  }

  return {
    created,
    skipped: entriesWithoutFeedback.length - created,
    feedbackIds,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ۳. Seed Gap Scenario — سناریوی فاصله غیرفعالی برای تست TASK-007
// ─────────────────────────────────────────────────────────────────────────────

export interface SeedGapScenarioResult {
  entriesCreated: number;
  feedbackCreated: number;
}

/**
 * سناریوی فاصله واقعی را seed می‌کند:
 *   ● `historyDays` تعهد با بازخورد (تاریخچه سالم)
 *   ● ۱ تعهد بدون بازخورد (آخرین تعهد قبل از فاصله — تریگر FeedbackForm)
 *   ● `gapDays` روز خالی (فاصله واقعی — تریگر GapForm)
 *   ● بدون تعهد امروز (کاربر تازه برگشته)
 *
 * جریان تست:
 *   ۱. ثبت سناریو → داشبورد → FeedbackForm (تعهد بدون بازخورد)
 *   ۲. ثبت بازخورد → refresh → GapForm (توضیح فاصله)
 *   ۳. ثبت توضیح → refresh → EntryForm (تعهد امروز)
 */
export async function seedGapScenario(
  userId: string,
  historyDays: number = 5,
  gapDays: number = 3,
): Promise<SeedGapScenarioResult> {
  if (!IS_DEV_MODE) throw new Error("seedGapScenario فقط در dev مجاز است");

  const nowMs = getNow().getTime();
  let entriesCreated = 0;
  let feedbackCreated = 0;

  // ۱. تاریخچه: تعهدهایی که بازخورد دارند
  //    از قدیم‌ترین به جدیدترین: (gapDays + historyDays) روز پیش تا (gapDays + 1) روز پیش
  for (let i = gapDays + historyDays; i >= gapDays + 1; i--) {
    const date = getDateForDB(nowMs, i);
    const createdAt = getCreatedAtForDay(nowMs, i);
    const editableUntil = new Date(createdAt.getTime() + ENTRY_EDIT_WINDOW_MS);

    const existing = await prisma.dailyEntry.findUnique({
      where: { userId_date: { userId, date } },
      select: { id: true },
    });
    if (existing) continue;

    const entry = await prisma.dailyEntry.create({
      data: {
        userId,
        content: SEED_CONTENTS[(i - 1) % SEED_CONTENTS.length],
        date, createdAt, editableUntil,
        isLocked: true, devSeed: true,
      },
    });
    entriesCreated++;

    // بازخورد — ۷۰٪ DONE به‌صورت alternating
    const isDone = feedbackCreated % 10 < 7;
    await prisma.entryFeedback.create({
      data: {
        entryId: entry.id,
        status: isDone ? "DONE" : "NOT_DONE",
        note: isDone ? null : "نشد این بار",
        devSeed: true,
      },
    });
    feedbackCreated++;
  }

  // ۲. آخرین تعهد فعال — بدون بازخورد (تریگر FeedbackForm)
  //    این تعهد `gapDays` روز پیش ثبت شده و کاربر جواب نداده
  const lastDate = getDateForDB(nowMs, gapDays);
  const lastCreatedAt = getCreatedAtForDay(nowMs, gapDays);

  const existingLast = await prisma.dailyEntry.findUnique({
    where: { userId_date: { userId, date: lastDate } },
    select: { id: true },
  });

  if (!existingLast) {
    await prisma.dailyEntry.create({
      data: {
        userId,
        content: SEED_CONTENTS[gapDays % SEED_CONTENTS.length],
        date: lastDate,
        createdAt: lastCreatedAt,
        editableUntil: new Date(lastCreatedAt.getTime() + ENTRY_EDIT_WINDOW_MS),
        isLocked: true,
        devSeed: true,
        // بدون EntryFeedback — عمداً، برای تریگر FeedbackForm
      },
    });
    entriesCreated++;
  }

  // ۳. روزهای (gapDays - 1) تا ۱ (دیروز): بدون تعهد — فاصله واقعی (تریگر GapForm)
  // ۴. امروز: بدون تعهد — کاربر تازه برگشته (بعد از GapForm → EntryForm نشان داده می‌شود)

  return { entriesCreated, feedbackCreated };
}

// ─────────────────────────────────────────────────────────────────────────────
// ۴. Seed Entries With Feedback — تعهد با بازخورد (تعداد دلخواه)
// ─────────────────────────────────────────────────────────────────────────────

export interface SeedEntriesWithFeedbackResult {
  created: number;
  skipped: number;
  feedbackCreated: number;
}

/**
 * N تعهد گذشته + بازخورد برای همه آنها seed می‌کند.
 * state واقعی: هر تعهد ثبت‌شده لزوماً بازخورد دارد (API این را enforce می‌کند).
 */
export async function seedEntriesWithFeedback(
  userId: string,
  days: number = 7,
): Promise<SeedEntriesWithFeedbackResult> {
  if (!IS_DEV_MODE) throw new Error("seedEntriesWithFeedback فقط در dev مجاز است");

  const entries = await seedEntries(userId, days, true);
  const feedback = await seedFeedback(userId, 1.0, 0.7);
  return { created: entries.created, skipped: entries.skipped, feedbackCreated: feedback.created };
}

// ─────────────────────────────────────────────────────────────────────────────
// ۵. Seed Full Week — یک هفته کامل (تعهد + بازخورد)
// ─────────────────────────────────────────────────────────────────────────────

export interface SeedFullWeekResult {
  entries: SeedEntriesResult;
  feedback: SeedFeedbackResult;
}

/**
 * یک هفته کامل: ۷ تعهد گذشته + بازخورد برای اکثر آنها
 * مناسب برای تست جریان کامل و گزارش هفتگی AI
 */
export async function seedFullWeek(userId: string): Promise<SeedFullWeekResult> {
  if (!IS_DEV_MODE) throw new Error("seedFullWeek فقط در dev مجاز است");

  const entries = await seedEntries(userId, 7, true);
  const feedback = await seedFeedback(userId, 0.85, 0.7);

  return { entries, feedback };
}
