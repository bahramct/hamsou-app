// GET /api/admin/livechat/conversations — صفِ گفتگوهای چت آنلاین (DECISION-049)
// enforce: support.read. فهرست سشن‌های دارای پیام، مرتب بر اساس آخرین فعالیت،
// همراه با اطلاعات کاربر + تعداد پیام خوانده‌نشدهٔ کاربر (unread صف) + فلگ مخفی‌سازی.
// کنسول این را با فاصلهٔ کوتاه (~۵ث) poll می‌کند.

import { NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { getNow } from "@/lib/dev/time";
import { prisma } from "@/lib/db/client";
import { dayKeyForIran } from "@/lib/support/chat";
import { formatJalaliFromISO } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const LIMIT = 100;

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!can(ctx, "support.read")) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const todayKey = dayKeyForIran(getNow());

  const sessions = await prisma.supportChatSession.findMany({
    where: { OR: [{ lastUserAt: { not: null } }, { lastAdminAt: { not: null } }] },
    orderBy: [{ lastUserAt: "desc" }, { lastAdminAt: "desc" }],
    take: LIMIT,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          phone: true,
          avatarPreset: true,
          avatarImage: true,
          supportChatHiddenUntil: true,
        },
      },
    },
  });

  // unread per session بدون filtered _count (سازگار با همهٔ نسخه‌های Prisma)
  const unreadBySession = new Map<string, number>();
  if (sessions.length > 0) {
    const grouped = await prisma.supportChatMessage.groupBy({
      by: ["sessionId"],
      where: {
        sessionId: { in: sessions.map((s) => s.id) },
        authorType: "user",
        readByAdminAt: null,
      },
      _count: { _all: true },
    });
    for (const g of grouped) unreadBySession.set(g.sessionId, g._count._all);
  }

  const items = sessions.map((s) => {
    const lastActivity = s.lastUserAt ?? s.lastAdminAt ?? s.createdAt;
    // کاربر این سشن را نزد خود مخفی کرده اگر watermark از آخرین فعالیتش جلوتر/برابر باشد
    const userHidden =
      s.user.supportChatHiddenUntil != null &&
      s.user.supportChatHiddenUntil >= lastActivity;
    return {
      sessionId: s.id,
      userId: s.user.id,
      displayName: s.user.displayName,
      phone: s.user.phone,
      avatarPreset: s.user.avatarPreset,
      avatarImage: s.user.avatarImage,
      dayKey: s.dayKey,
      label: formatJalaliFromISO(s.dayKey),
      isToday: s.dayKey === todayKey,
      lastActivity: lastActivity.toISOString(),
      unread: unreadBySession.get(s.id) ?? 0,
      userHidden,
    };
  });

  return NextResponse.json({ ok: true, conversations: items });
}
