import { NextResponse } from "next/server";
import { IS_DEV_MODE } from "@/lib/env";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { resetDevTime } from "@/lib/dev/time";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dev/reset/me — پاک‌سازی داده‌های seed کاربر جاری
//
// فقط رکوردهایی که devSeed: true هستند حذف می‌شوند.
// داده‌های واقعی کاربر دست‌نخورده باقی می‌مانند.
// به‌اضافه: زمان سرور هم ریست می‌شود (offset → 0).
//
// Response: { ok, deleted: { entries, feedback, gaps, reports } }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST() {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });
  }

  const userId = user.userId;

  // ۱. حذف بازخوردهای seed (از طریق تعهدهای seed)
  const seedEntries = await prisma.dailyEntry.findMany({
    where: { userId, devSeed: true },
    select: { id: true },
  });
  const seedEntryIds = seedEntries.map((e: { id: string }) => e.id);

  const deletedFeedback = await prisma.entryFeedback.deleteMany({
    where: { entryId: { in: seedEntryIds } },
  });

  // ۲. حذف تعهدهای seed
  const deletedEntries = await prisma.dailyEntry.deleteMany({
    where: { userId, devSeed: true },
  });

  // ۳. حذف GapRecord های seed
  const deletedGaps = await prisma.gapRecord.deleteMany({
    where: { userId, devSeed: true },
  });

  // ۴. حذف WeeklyReport های seed
  const deletedReports = await prisma.weeklyReport.deleteMany({
    where: { userId, devSeed: true },
  });

  // ۵. ریست زمان سرور
  resetDevTime();

  return NextResponse.json({
    ok: true,
    deleted: {
      entries: deletedEntries.count,
      feedback: deletedFeedback.count,
      gaps: deletedGaps.count,
      reports: deletedReports.count,
    },
  });
}
