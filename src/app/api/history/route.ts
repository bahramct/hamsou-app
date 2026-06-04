// ─────────────────────────────────────────────────────────────────────────────
// GET /api/history — تاریخچه تعهدهای کاربر (cursor-based, date DESC)
//
// Query params:
//   cursor — ISO date string آخرین آیتم صفحه قبل (اختیاری)
//   limit  — تعداد آیتم در هر صفحه (پیش‌فرض ۱۰، حداکثر ۳۰)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { formatJalali, formatWeekday } from "@/lib/utils/date";
import type { HistoryPage } from "@/types/history";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const cursorParam = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );

  // cursor = تاریخ آخرین آیتم صفحه قبل — آیتم‌های قدیمی‌تر از cursor
  const cursorDate = cursorParam ? new Date(cursorParam) : null;

  const entries = await prisma.dailyEntry.findMany({
    where: {
      userId: user.userId,
      ...(cursorDate ? { date: { lt: cursorDate } } : {}),
    },
    orderBy: { date: "desc" },
    take: limit + 1, // یک آیتم اضافه برای تشخیص hasMore
    select: {
      id: true,
      content: true,
      date: true,
      feedback: {
        select: { status: true, note: true },
      },
    },
  });

  const hasMore = entries.length > limit;
  const items = hasMore ? entries.slice(0, limit) : entries;

  const page: HistoryPage = {
    items: items.map((e) => ({
      id: e.id,
      content: e.content,
      date: e.date.toISOString(),
      dateLabel: formatJalali(e.date),
      weekdayLabel: formatWeekday(e.date),
      feedback: e.feedback
        ? { status: e.feedback.status as "DONE" | "NOT_DONE", note: e.feedback.note }
        : null,
    })),
    nextCursor: hasMore ? items[items.length - 1].date.toISOString() : null,
    hasMore,
  };

  return NextResponse.json({ ok: true, ...page });
}
