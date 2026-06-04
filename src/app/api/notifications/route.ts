// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications — لیست اعلان‌های کاربر + شمارش خوانده‌نشده (DECISION-046)
// خروجی خام است (type + data)؛ رندر متن/تن/لینک سمت client با describeNotification.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { listNotifications, unreadCount } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    listNotifications(user.userId, { limit: 30 }),
    unreadCount(user.userId),
  ]);

  return NextResponse.json({
    unread,
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      data: n.data,
      linkUrl: n.linkUrl,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
