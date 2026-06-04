// POST /api/notifications/read-all — علامت همهٔ اعلان‌ها به‌عنوان خوانده‌شده (DECISION-046)

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { markAllRead } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await markAllRead(user.userId);
  return NextResponse.json({ ok: true });
}
