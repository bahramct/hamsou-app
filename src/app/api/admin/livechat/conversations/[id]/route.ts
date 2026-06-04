// GET /api/admin/livechat/conversations/[id] — جزئیات یک سشن چت (DECISION-049)
// enforce: support.read. ادمین «همهٔ» پیام‌ها را می‌بیند (watermark کاربر اعمال نمی‌شود).
// باز کردن گفتگو → پیام‌های کاربر «خوانده‌شده توسط پشتیبان» علامت می‌خورند (unread پاک).
// watermark کاربر هم برمی‌گردد تا UI خط «کاربر تا این‌جا را مخفی کرد» را نشان دهد.

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { getNow } from "@/lib/dev/time";
import { prisma } from "@/lib/db/client";
import { formatJalaliFromISO } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!can(ctx, "support.read")) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { id } = await params;

  const session = await prisma.supportChatSession.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          phone: true,
          avatarPreset: true,
          plan: true,
          supportChatHiddenUntil: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { authorAdmin: { select: { displayName: true } } },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ ok: false, message: "گفتگو یافت نشد" }, { status: 404 });
  }

  // باز کردن = دیده‌شدن پیام‌های کاربر توسط پشتیبان
  await prisma.supportChatMessage.updateMany({
    where: { sessionId: id, authorType: "user", readByAdminAt: null },
    data: { readByAdminAt: getNow() },
  });

  return NextResponse.json({
    ok: true,
    session: {
      sessionId: session.id,
      dayKey: session.dayKey,
      label: formatJalaliFromISO(session.dayKey),
      hiddenUntil: session.user.supportChatHiddenUntil?.toISOString() ?? null,
      user: {
        id: session.user.id,
        displayName: session.user.displayName,
        phone: session.user.phone,
        avatarPreset: session.user.avatarPreset,
        plan: session.user.plan,
      },
      messages: session.messages.map((m) => ({
        id: m.id,
        authorType: m.authorType === "admin" ? "admin" : "user",
        authorName: m.authorAdmin?.displayName ?? null,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  });
}
