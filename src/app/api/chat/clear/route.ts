// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat/clear — ثبت watermark پاک‌کردن چت همدم (DECISION-052)
//
// chatClearedAt = now() روی User ذخیره می‌شود.
// GET /api/chat/messages فقط پیام‌های پس از این تاریخ را برمی‌گرداند.
// داده‌های قبلی در DB برای AI context و نگه‌داری حفظ می‌شوند.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getNow } from "@/lib/dev/time";
import { prisma } from "@/lib/db/client";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const now = getNow();

  await prisma.user.update({
    where: { id: user.userId },
    data: { chatClearedAt: now },
  });

  return NextResponse.json({ ok: true, clearedAt: now.toISOString() });
}
