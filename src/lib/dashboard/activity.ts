// ─────────────────────────────────────────────────────────────────────────────
// dashboard/activity.ts — فعالیتِ هفتهٔ جاری برای داشبورد (TASK-28، فاز ۱)
//
// منبعِ واحدِ «نبضِ هفته» + نوارِ هفتگیِ کادر سبز. قطعی (از DB)، بدون AI.
// هفته = شنبه تا جمعهٔ ایران (getCurrentWeekRange). وضعیتِ هر روز دسته‌ای است:
//   wrote (تعهد ثبت شده) | freeze (در بازهٔ فریز) | empty (نه نوشت، نه فریز) | future
// خط‌قرمزِ مانیفست: حالت‌ها «حضور»‌اند نه نمره؛ هیچ درصد/استریک.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import {
  getCurrentWeekRange,
  getTodayDateForDB,
  isoToJalaliParts,
  JALALI_WEEKDAY_SHORT,
} from "@/lib/utils/date";

const DAY_MS = 24 * 60 * 60 * 1000;

export type WeekDayState = "wrote" | "empty" | "freeze" | "future";

export interface WeekDayActivity {
  /** "YYYY-MM-DD" میلادی (کلید) */
  dateIso: string;
  /** روزِ ماهِ جلالی (برای نمایش) */
  jalaliDay: number;
  /** حرفِ روزِ هفته: ش..ج */
  weekdayShort: string;
  isToday: boolean;
  state: WeekDayState;
  /** متنِ تعهدِ آن روز (برای tooltip) — اگر نوشته باشد */
  entryContent: string | null;
}

export interface WeekActivity {
  days: WeekDayActivity[];
  wroteCount: number;
  freezeCount: number;
  emptyCount: number;
  todayWrote: boolean;
}

/** "YYYY-MM-DD" از اجزای UTC یک Dateِ begin-of-day-ایران. */
function utcIso(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** فعالیتِ ۷ روزِ هفتهٔ جاری (شنبه→جمعه). */
export async function getWeekActivity(userId: string): Promise<WeekActivity> {
  const { weekStart, weekEnd } = getCurrentWeekRange();
  const today = getTodayDateForDB();

  const [entries, freezes] = await Promise.all([
    prisma.dailyEntry.findMany({
      where: { userId, date: { gte: weekStart, lte: weekEnd } },
      select: { date: true, content: true },
    }),
    prisma.gapRecord.findMany({
      where: {
        userId,
        type: "freeze",
        fromDate: { lte: weekEnd },
        toDate: { gte: weekStart },
      },
      select: { fromDate: true, toDate: true },
    }),
  ]);

  const entryByIso = new Map<string, string>();
  for (const e of entries) entryByIso.set(utcIso(e.date), e.content);

  const days: WeekDayActivity[] = [];
  let wroteCount = 0;
  let freezeCount = 0;
  let emptyCount = 0;
  let todayWrote = false;

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.getTime() + i * DAY_MS);
    const iso = utcIso(d);
    const isToday = d.getTime() === today.getTime();
    const isFuture = d.getTime() > today.getTime();
    const parts = isoToJalaliParts(iso);
    const content = entryByIso.get(iso) ?? null;
    const inFreeze = freezes.some(
      (f) => d.getTime() >= f.fromDate.getTime() && d.getTime() <= f.toDate.getTime()
    );

    let state: WeekDayState;
    if (isFuture) {
      state = "future";
    } else if (content) {
      state = "wrote";
      wroteCount++;
      if (isToday) todayWrote = true;
    } else if (inFreeze) {
      state = "freeze";
      freezeCount++;
    } else {
      state = "empty";
      emptyCount++;
    }

    days.push({
      dateIso: iso,
      jalaliDay: parts ? parts.jd : 0,
      weekdayShort: JALALI_WEEKDAY_SHORT[i],
      isToday,
      state,
      entryContent: content,
    });
  }

  return { days, wroteCount, freezeCount, emptyCount, todayWrote };
}
