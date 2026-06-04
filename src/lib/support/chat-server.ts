// ─────────────────────────────────────────────────────────────────────────────
// support/chat-server.ts — منطق سشن/پیامِ چت آنلاین (DECISION-049) — server-only
//
// route‌ها نازک می‌مانند و این‌جا تنها منبعِ منطق سشن روزانه، watermark مخفی‌سازی،
// و unread است. هیچ وابستگی به React ندارد.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import {
  dayKeyForIran,
  type ChatMessageDTO,
  type ChatSessionDTO,
} from "@/lib/support/chat";
import { formatJalaliFromISO } from "@/lib/utils/date";

function serialize(m: {
  id: string;
  authorType: string;
  body: string;
  createdAt: Date;
}): ChatMessageDTO {
  return {
    id: m.id,
    authorType: m.authorType === "admin" ? "admin" : "user",
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  };
}

/** watermark را به Date تبدیل می‌کند (null → ابتدای زمان، یعنی همه‌چیز دیده می‌شود). */
function watermark(hiddenUntil: Date | null): Date {
  return hiddenUntil ?? new Date(0);
}

/** سشن امروزِ کاربر را برمی‌گرداند (در نبود، می‌سازد). */
export async function getOrCreateTodaySession(userId: string, now: Date) {
  const dayKey = dayKeyForIran(now);
  return prisma.supportChatSession.upsert({
    where: { userId_dayKey: { userId, dayKey } },
    update: {},
    create: { userId, dayKey, status: "active" },
  });
}

/**
 * سشن‌های قابل‌مشاهدهٔ کاربر را می‌سازد: روزهای قبل به‌عنوان هیستوری + سشن امروز.
 * فقط پیام‌های بعد از watermark دیده می‌شوند؛ سشن‌های قبلیِ خالی حذف می‌شوند ولی
 * سشن امروز همیشه (حتی خالی) برمی‌گردد تا پنجره خوش‌آمد را نشان دهد و قابل تایپ باشد.
 */
export async function buildVisibleSessions(
  userId: string,
  hiddenUntil: Date | null,
  now: Date
): Promise<ChatSessionDTO[]> {
  const wm = watermark(hiddenUntil);
  const todayKey = dayKeyForIran(now);

  const sessions = await prisma.supportChatSession.findMany({
    where: { userId },
    orderBy: { dayKey: "asc" },
    include: {
      messages: {
        where: { createdAt: { gt: wm } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const out: ChatSessionDTO[] = [];
  let hasToday = false;

  for (const s of sessions) {
    const isToday = s.dayKey === todayKey;
    if (isToday) hasToday = true;
    // سشن قبلیِ بدون پیامِ قابل‌مشاهده → نمایش نده (مخفی‌شده یا خالی)
    if (!isToday && s.messages.length === 0) continue;
    out.push({
      dayKey: s.dayKey,
      label: formatJalaliFromISO(s.dayKey),
      isToday,
      messages: s.messages.map(serialize),
    });
  }

  // تضمین وجود سشن امروز در پاسخ (حتی اگر هنوز ردیف DB ندارد)
  if (!hasToday) {
    out.push({
      dayKey: todayKey,
      label: formatJalaliFromISO(todayKey),
      isToday: true,
      messages: [],
    });
  }

  return out;
}

/** پیام‌های پشتیبانِ دیده‌نشده (بعد از watermark) را «خوانده‌شده توسط کاربر» علامت می‌زند. */
export async function markAdminMessagesReadByUser(
  userId: string,
  hiddenUntil: Date | null,
  now: Date
): Promise<void> {
  await prisma.supportChatMessage.updateMany({
    where: {
      authorType: "admin",
      readByUserAt: null,
      createdAt: { gt: watermark(hiddenUntil) },
      session: { userId },
    },
    data: { readByUserAt: now },
  });
}

/** شمارش پیام‌های پشتیبانِ خوانده‌نشده (برای badge آیکون چت کاربر). */
export async function countUnreadForUser(
  userId: string,
  hiddenUntil: Date | null
): Promise<number> {
  return prisma.supportChatMessage.count({
    where: {
      authorType: "admin",
      readByUserAt: null,
      createdAt: { gt: watermark(hiddenUntil) },
      session: { userId },
    },
  });
}

/** پیام‌های امروزِ کاربر بعد از یک cursor زمانی (برای polling پنجرهٔ باز). */
export async function getTodayMessagesAfter(
  userId: string,
  hiddenUntil: Date | null,
  now: Date,
  afterIso: string | null
): Promise<ChatMessageDTO[]> {
  const dayKey = dayKeyForIran(now);
  const session = await prisma.supportChatSession.findUnique({
    where: { userId_dayKey: { userId, dayKey } },
    select: { id: true },
  });
  if (!session) return [];

  const after = afterIso ? new Date(afterIso) : null;
  const lowerBound =
    after && !isNaN(after.getTime())
      ? new Date(Math.max(after.getTime(), watermark(hiddenUntil).getTime()))
      : watermark(hiddenUntil);

  const messages = await prisma.supportChatMessage.findMany({
    where: { sessionId: session.id, createdAt: { gt: lowerBound } },
    orderBy: { createdAt: "asc" },
  });
  return messages.map(serialize);
}
