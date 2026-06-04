// POST /api/support/chat/clear — کاربر چت خود را «پاک» می‌کند (DECISION-049)
// داده حذف نمی‌شود؛ فقط watermark مخفی‌سازی روی «الان» تنظیم می‌شود. کاربر دیگر
// پیام‌های قبل از این لحظه را نمی‌بیند، اما پنل ادمین همه‌چیز را با فلگ نگه می‌دارد.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getNow } from "@/lib/dev/time";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.user.update({
    where: { id: user.userId },
    data: { supportChatHiddenUntil: getNow() },
  });

  return NextResponse.json({ ok: true });
}
