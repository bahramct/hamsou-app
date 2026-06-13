// ─────────────────────────────────────────────────────────────────────────────
// /api/cron/reminders — تیکِ زمان‌بندِ یادآوریِ هدف (DECISION-082)
//
// محافظت با env `CRON_SECRET`. سه شکلِ ارسالِ secret پشتیبانی می‌شود:
//   • `Authorization: Bearer <secret>` (استانداردِ Vercel Cron)
//   • هدرِ `x-cron-secret: <secret>` (تریگرِ عمومی/self-host)
//   • کوئریِ `?secret=<secret>`
// هم GET و هم POST پذیرفته می‌شوند (Vercel Cron با GET صدا می‌زند).
// در prod هر ۱۵ دقیقه (vercel.json). در dev از /api/dev/goal/reminder-tick استفاده کن (§۱۳).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { runReminderTick } from "@/lib/goal/reminder-scheduler";

function authorized(request: NextRequest): { ok: true } | { ok: false; status: number; message: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false, status: 503, message: "CRON_SECRET تنظیم نشده." };

  const bearer = request.headers.get("authorization");
  const fromBearer = bearer?.toLowerCase().startsWith("bearer ") ? bearer.slice(7) : null;
  const provided =
    fromBearer ??
    request.headers.get("x-cron-secret") ??
    request.nextUrl.searchParams.get("secret");

  if (provided !== secret) return { ok: false, status: 401, message: "unauthorized" };
  return { ok: true };
}

async function handle(request: NextRequest) {
  const auth = authorized(request);
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
  const result = await runReminderTick();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}
