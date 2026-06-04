import { NextRequest, NextResponse } from "next/server";
import { IS_DEV_MODE } from "@/lib/env";
import {
  setDevTime,
  getNow,
  getDevTimeOffsetMs,
  isDevTimeShifted,
} from "@/lib/dev/time";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dev/time/set — وضعیت جاری زمان dev
//
// بدون بدنه — فقط وضعیت فعلی offset و زمان شبیه‌سازی‌شده سرور را برمی‌گرداند.
// UI DevTimeTravel در هنگام mount این را صدا می‌کند تا مقدار اولیه نمایش داشته باشد.
// ─────────────────────────────────────────────────────────────────────────────
export function GET() {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    isShifted: isDevTimeShifted(),
    offsetMs: getDevTimeOffsetMs(),
    simulatedNow: getNow().toISOString(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dev/time/set — تنظیم زمان سرور در dev
//
// بدنه (یکی از دو حالت):
//   { targetIso: "2026-05-20T10:00:00" }  — رفتن به تاریخ مشخص
//   { offsetDays: -7 }                    — تغییر نسبی از «الان» dev
//
// خروجی: { ok, offsetMs, simulatedNow, isShifted }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Partial<{ targetIso: string; offsetDays: number }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let targetMs: number;

  if (typeof body.targetIso === "string") {
    // حالت ۱ — تاریخ دقیق
    const parsed = new Date(body.targetIso);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "targetIso نامعتبر است — فرمت ISO 8601 مورد انتظار است" },
        { status: 400 }
      );
    }
    targetMs = parsed.getTime();
  } else if (typeof body.offsetDays === "number") {
    // حالت ۲ — تغییر نسبی از «الان» dev (نه زمان واقعی)
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    targetMs = getNow().getTime() + body.offsetDays * MS_PER_DAY;
  } else {
    return NextResponse.json(
      { error: "باید targetIso یا offsetDays ارسال شود" },
      { status: 400 }
    );
  }

  setDevTime(targetMs);

  return NextResponse.json({
    ok: true,
    isShifted: isDevTimeShifted(),
    offsetMs: getDevTimeOffsetMs(),
    simulatedNow: getNow().toISOString(),
  });
}
