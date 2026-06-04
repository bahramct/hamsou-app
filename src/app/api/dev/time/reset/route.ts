import { NextResponse } from "next/server";
import { IS_DEV_MODE } from "@/lib/env";
import { resetDevTime } from "@/lib/dev/time";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dev/time/reset — بازگشت سرور به زمان واقعی
//
// بدون بدنه. offset را صفر می‌کند.
// خروجی: { ok, simulatedNow } — simulatedNow = now واقعی
// ─────────────────────────────────────────────────────────────────────────────
export async function POST() {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  resetDevTime();

  return NextResponse.json({
    ok: true,
    isShifted: false,
    offsetMs: 0,
    simulatedNow: new Date().toISOString(),
  });
}
