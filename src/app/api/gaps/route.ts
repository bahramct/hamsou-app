// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gaps — ثبت فاصله غیرفعالی (TASK-007)
//
// body: { note?: string }
//
// سرور از آخرین تعهد کاربر بازه فاصله را محاسبه می‌کند —
// کاربر نمی‌تواند تاریخ دستی بدهد (امنیت).
//
// در dev mode، GapRecord با devSeed: true علامت می‌خورد تا reset پاکش کند.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getTodayDateForDB } from "@/lib/utils/date";
import { IS_DEV_MODE } from "@/lib/env";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  // ۱. احراز هویت
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // ۲. خواندن body (note اختیاری است)
  let note: string | null = null;
  try {
    const body = (await request.json()) as { note?: unknown };
    if (typeof body.note === "string") {
      const trimmed = body.note.trim();
      if (trimmed.length > 500) {
        return NextResponse.json(
          { ok: false, error: "note_too_long", message: "یادداشت حداکثر ۵۰۰ کاراکتر می‌تواند باشد" },
          { status: 422 },
        );
      }
      note = trimmed.length > 0 ? trimmed : null;
    }
  } catch {
    // body خالی یا invalid JSON — بدون یادداشت ادامه می‌دهیم
  }

  // ۳. محاسبه بازه فاصله از روی آخرین تعهد کاربر
  const todayDate = getTodayDateForDB();
  const yesterday = new Date(todayDate.getTime() - MS_PER_DAY);

  const lastEntry = await prisma.dailyEntry.findFirst({
    where: { userId: user.userId },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  // اگر هیچ تعهدی وجود ندارد یا فاصله‌ای نیست → خطا
  if (!lastEntry || lastEntry.date >= yesterday) {
    return NextResponse.json(
      { ok: false, error: "no_gap_to_record", message: "فاصله‌ای برای ثبت وجود ندارد" },
      { status: 400 },
    );
  }

  const dayAfterLastEntry = new Date(lastEntry.date.getTime() + MS_PER_DAY);

  // ۴. چک وجود GapRecord قبلی برای این فاصله
  const existingGap = await prisma.gapRecord.findFirst({
    where: {
      userId: user.userId,
      fromDate: dayAfterLastEntry,
    },
    select: { id: true },
  });

  if (existingGap) {
    return NextResponse.json(
      { ok: false, error: "gap_already_recorded", message: "این فاصله قبلاً ثبت شده" },
      { status: 409 },
    );
  }

  // ۵. ثبت GapRecord
  await prisma.gapRecord.create({
    data: {
      userId: user.userId,
      fromDate: dayAfterLastEntry,
      toDate: yesterday,
      note,
      // در dev mode با devSeed علامت می‌خورد تا reset پاکش کند (DECISION-021)
      devSeed: IS_DEV_MODE ? true : undefined,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
