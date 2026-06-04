// PATCH /api/notifications/[id]/read — علامت یک اعلان به‌عنوان خوانده‌شده (DECISION-046)
// مالکیت با userId در where تضمین می‌شود (markRead).

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { markRead } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await markRead(user.userId, id);
  return NextResponse.json({ ok: true });
}
