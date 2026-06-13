// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dev/goal/reminder-tick — اجرای دستیِ زمان‌بندِ یادآوری در dev (§۱۳، DECISION-082)
//
// گاردِ §۱۳: فقط در dev (در prod → ۴۰۴). برای تستِ یادآوری بدون انتظارِ واقعی، همراه با
// time-travel در DevDataPanel. مثلِ /api/cron/reminders اما بدون نیاز به secret.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { IS_DEV_MODE } from "@/lib/env";
import { runReminderTick } from "@/lib/goal/reminder-scheduler";

export async function POST() {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const result = await runReminderTick();
  return NextResponse.json({ ok: true, ...result });
}
