// DELETE /api/notifications/clear-all — حذف دائمی همه یادآوری‌های کاربر
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.notification.deleteMany({ where: { userId: user.userId } });

  return NextResponse.json({ ok: true });
}
