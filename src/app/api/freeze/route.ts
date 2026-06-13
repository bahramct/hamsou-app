// ─────────────────────────────────────────────────────────────────────────────
// /api/freeze — فریز پیشگیرانه تعهدات روزانه (DECISION-083)
//
// GET  → فریز فعالِ امروز (اگر وجود داشته باشد)
// POST body: { fromIso, toIso, note? } → ایجاد فریز
//
// قوانین:
//   - از امروز به بعد (fromDate ≥ today)
//   - toDate > fromDate
//   - حداکثر ۶۰ روز
//   - تداخل با فریز فعال دیگر ممنوع
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getTodayDateForDB, formatJalali } from "@/lib/utils/date";
import { IS_DEV_MODE } from "@/lib/env";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_FREEZE_DAYS = 60;

// ─── GET — فریز فعال امروز ────────────────────────────────────────────────────
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const today = getTodayDateForDB();

  const active = await prisma.gapRecord.findFirst({
    where: {
      userId: user.userId,
      type: "freeze",
      fromDate: { lte: today },
      toDate: { gte: today },
    },
    select: { id: true, fromDate: true, toDate: true, note: true },
  });

  if (!active) return NextResponse.json({ ok: true, freeze: null });

  const daysLeft = Math.max(
    1,
    Math.round((active.toDate.getTime() - today.getTime()) / MS_PER_DAY) + 1,
  );

  return NextResponse.json({
    ok: true,
    freeze: {
      id: active.id,
      fromDateLabel: formatJalali(active.fromDate),
      toDateLabel: formatJalali(active.toDate),
      fromIso: active.fromDate.toISOString(),
      toIso: active.toDate.toISOString(),
      note: active.note,
      daysLeft,
    },
  });
}

// ─── POST — ایجاد فریز ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let fromIso: string, toIso: string, note: string | null = null;
  try {
    const body = (await request.json()) as { fromIso?: unknown; toIso?: unknown; note?: unknown };
    if (typeof body.fromIso !== "string" || typeof body.toIso !== "string") {
      return NextResponse.json({ ok: false, message: "fromIso و toIso الزامی‌اند" }, { status: 422 });
    }
    fromIso = body.fromIso;
    toIso = body.toIso;
    if (typeof body.note === "string") {
      const t = body.note.trim();
      note = t.length > 0 ? t.slice(0, 300) : null;
    }
  } catch {
    return NextResponse.json({ ok: false, message: "داده‌های ارسالی نامعتبر است" }, { status: 400 });
  }

  const today = getTodayDateForDB();

  // parse + normalize به begin-of-day UTC
  const fromDate = isoToBeginOfDay(fromIso);
  const toDate = isoToBeginOfDay(toIso);

  if (!fromDate || !toDate) {
    return NextResponse.json({ ok: false, message: "تاریخ‌های ارسالی نامعتبرند" }, { status: 422 });
  }
  if (fromDate < today) {
    return NextResponse.json({ ok: false, message: "تاریخ شروع نمی‌تواند در گذشته باشد" }, { status: 422 });
  }
  if (toDate <= fromDate) {
    return NextResponse.json({ ok: false, message: "تاریخ پایان باید بعد از تاریخ شروع باشد" }, { status: 422 });
  }

  const durationDays = Math.round((toDate.getTime() - fromDate.getTime()) / MS_PER_DAY) + 1;
  if (durationDays > MAX_FREEZE_DAYS) {
    return NextResponse.json(
      { ok: false, message: `فریز حداکثر ${MAX_FREEZE_DAYS} روز می‌تواند باشد` },
      { status: 422 },
    );
  }

  // چک تداخل با فریز دیگری
  const overlap = await prisma.gapRecord.findFirst({
    where: {
      userId: user.userId,
      type: "freeze",
      fromDate: { lte: toDate },
      toDate: { gte: fromDate },
    },
    select: { id: true },
  });
  if (overlap) {
    return NextResponse.json(
      { ok: false, message: "این بازه با یک فریز موجود تداخل دارد" },
      { status: 409 },
    );
  }

  const freeze = await prisma.gapRecord.create({
    data: {
      userId: user.userId,
      fromDate,
      toDate,
      note,
      type: "freeze",
      devSeed: IS_DEV_MODE ? true : undefined,
    },
  });

  return NextResponse.json({ ok: true, id: freeze.id }, { status: 201 });
}

// ─── helper ───────────────────────────────────────────────────────────────────
function isoToBeginOfDay(iso: string): Date | null {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  } catch {
    return null;
  }
}
