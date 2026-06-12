// ─────────────────────────────────────────────────────────────────────────────
// stats/commitments.ts — شمارش تعهدهای کاربر (DECISION-074)
//
// قاعدهٔ محصول: «تعداد تعهد ثبت‌شده» = تعداد روزهایی که کاربر واقعاً تعهد ثبت کرده.
// روزهای داخل بازه‌های «فاصله» (GapRecord) جزو روزهای تعهد حساب نمی‌شوند — حتی اگر
// ردیف تعهدی در آن بازه وجود داشته باشد (دادهٔ گپ برای تحلیل دست‌نخورده می‌ماند).
// منبع واحد برای سایت (پروفایل) و پنل ادمین (هم‌ترازی).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";

const DAY_MS = 24 * 60 * 60 * 1000;

/** ابتدای روزِ یک تاریخ (local) — تعهد و گپ هر دو begin-of-day ذخیره می‌شوند. */
function dayStart(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** آیا این روز داخل یکی از بازه‌های فاصله است؟ (بازه‌ها شامل هر دو سر) */
function inGap(dayMs: number, gaps: { from: number; to: number }[]): boolean {
  return gaps.some((g) => dayMs >= g.from && dayMs <= g.to);
}

/** تعداد تعهدهای ثبت‌شدهٔ کاربر — بدون روزهای داخل بازه‌های فاصله. */
export async function countCommitments(userId: string): Promise<number> {
  const gapRows = await prisma.gapRecord.findMany({
    where: { userId },
    select: { fromDate: true, toDate: true },
  });
  if (gapRows.length === 0) {
    return prisma.dailyEntry.count({ where: { userId } });
  }
  const gaps = gapRows.map((g) => ({ from: dayStart(g.fromDate), to: dayStart(g.toDate) }));
  const entries = await prisma.dailyEntry.findMany({
    where: { userId },
    select: { date: true },
  });
  return entries.filter((e) => !inGap(dayStart(e.date), gaps)).length;
}

/** نسخهٔ گروهی برای فهرست‌ها (مثل لیست کاربران پنل) — دو کوئری برای همهٔ کاربران. */
export async function countCommitmentsBulk(userIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>(userIds.map((id) => [id, 0]));
  if (userIds.length === 0) return result;

  const [entries, gapRows] = await Promise.all([
    prisma.dailyEntry.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, date: true },
    }),
    prisma.gapRecord.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, fromDate: true, toDate: true },
    }),
  ]);

  const gapsByUser = new Map<string, { from: number; to: number }[]>();
  for (const g of gapRows) {
    const arr = gapsByUser.get(g.userId) ?? [];
    arr.push({ from: dayStart(g.fromDate), to: dayStart(g.toDate) });
    gapsByUser.set(g.userId, arr);
  }

  for (const e of entries) {
    const gaps = gapsByUser.get(e.userId) ?? [];
    if (!inGap(dayStart(e.date), gaps)) {
      result.set(e.userId, (result.get(e.userId) ?? 0) + 1);
    }
  }
  return result;
}

/** جمع روزهای پوشش‌داده‌شده با فاصله‌ها (برای تحلیل/نمایش، نه کم‌کردن از عضویت). */
export async function countGapDays(userId: string): Promise<number> {
  const gapRows = await prisma.gapRecord.findMany({
    where: { userId },
    select: { fromDate: true, toDate: true },
  });
  return gapRows.reduce((sum, g) => {
    const days = Math.floor((dayStart(g.toDate) - dayStart(g.fromDate)) / DAY_MS) + 1;
    return sum + Math.max(0, days);
  }, 0);
}
