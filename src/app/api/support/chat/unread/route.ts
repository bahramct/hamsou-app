// GET /api/support/chat/unread — وضعیت سبکِ کارتِ ورودی کاربر (DECISION-049)
// برمی‌گرداند: تعداد پیام‌های پشتیبانِ خوانده‌نشده (badge) + presence/availability (نقطهٔ آنلاین).
// بدون هیچ side-effect (read را mark نمی‌کند). کارت این را با فاصلهٔ آرام (~۲۰ث) poll می‌کند.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getNow } from "@/lib/dev/time";
import { prisma } from "@/lib/db/client";
import { planAllows } from "@/lib/plans/access";
import { LIVE_CHAT_FEATURE_KEY } from "@/lib/support/chat";
import { getSupportChatStatus } from "@/lib/support/availability";
import { countUnreadForUser } from "@/lib/support/chat-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { plan: true, supportChatHiddenUntil: true },
  });
  const plan = dbUser?.plan ?? "FREE";
  if (!(await planAllows(plan, LIVE_CHAT_FEATURE_KEY))) {
    return NextResponse.json({ ok: true, allowed: false, count: 0 });
  }

  const [count, status] = await Promise.all([
    countUnreadForUser(user.userId, dbUser?.supportChatHiddenUntil ?? null),
    getSupportChatStatus(getNow()),
  ]);

  return NextResponse.json({
    ok: true,
    allowed: true,
    count,
    availability: status.availability,
    online: status.online,
  });
}
