// POST /api/admin/livechat/heartbeat — ثبت ضربان حضور پشتیبان (DECISION-049)
// کنسول چت ادمین این را هر ~۳۰ث صدا می‌زند تا نقطهٔ سبزِ presence در چت کاربر تازه بماند.
// گیت: support.read (هرکس کنسول را می‌بیند، حضورش شمرده می‌شود).

import { NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { touchAdminPresence } from "@/lib/support/presence";

export const dynamic = "force-dynamic";

export async function POST() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!can(ctx, "support.read")) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  await touchAdminPresence(ctx.admin.id);
  return NextResponse.json({ ok: true });
}
