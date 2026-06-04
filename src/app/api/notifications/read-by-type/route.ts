// POST /api/notifications/read-by-type — پاک‌کردن badge اعلان‌های یک نوع خاص (DECISION-046)
// body: { typePrefix: "support" }  →  همهٔ اعلان‌های support.* را خوانده‌شده mark می‌کند.
// کاربرد: به‌محض ورود به صفحهٔ تیکت‌ها، badge تیکت‌های پاسخ‌داده‌شده پاک می‌شود.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { typePrefix?: unknown } | null;
  const typePrefix = typeof body?.typePrefix === "string" ? body.typePrefix.trim() : "";
  if (!typePrefix) return NextResponse.json({ ok: true });

  await prisma.notification.updateMany({
    where: {
      userId: user.userId,
      readAt: null,
      type: { startsWith: typePrefix },
    },
    data: { readAt: getNow() },
  });

  return NextResponse.json({ ok: true });
}
