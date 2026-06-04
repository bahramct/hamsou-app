// GET /api/support/chat/poll?after=<ISO> — دلتای سبک برای پنجرهٔ باز (DECISION-049)
// پنجره هر ~۳ث این را صدا می‌زند: پیام‌های جدیدِ امروز پس از cursor + وضعیت/presence.
// پنجره باز است → پیام‌های پشتیبان را خوانده‌شده mark می‌کند (badge پاک).

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getNow } from "@/lib/dev/time";
import { prisma } from "@/lib/db/client";
import { planAllows } from "@/lib/plans/access";
import { LIVE_CHAT_FEATURE_KEY } from "@/lib/support/chat";
import { getSupportChatStatus } from "@/lib/support/availability";
import {
  getTodayMessagesAfter,
  markAdminMessagesReadByUser,
} from "@/lib/support/chat-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const now = getNow();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { plan: true, supportChatHiddenUntil: true },
  });
  const plan = dbUser?.plan ?? "FREE";
  if (!(await planAllows(plan, LIVE_CHAT_FEATURE_KEY))) {
    return NextResponse.json({ ok: true, allowed: false });
  }

  const hiddenUntil = dbUser?.supportChatHiddenUntil ?? null;
  const after = request.nextUrl.searchParams.get("after");

  const [status, messages] = await Promise.all([
    getSupportChatStatus(now),
    getTodayMessagesAfter(user.userId, hiddenUntil, now, after),
  ]);

  // پنجره باز است → دیده‌شدن پیام‌های پشتیبان
  if (messages.some((m) => m.authorType === "admin")) {
    await markAdminMessagesReadByUser(user.userId, hiddenUntil, now);
  }

  return NextResponse.json({
    ok: true,
    allowed: true,
    availability: status.availability,
    online: status.online,
    withinHours: status.withinHours,
    messages,
  });
}
