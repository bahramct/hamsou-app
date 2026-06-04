// ─────────────────────────────────────────────────────────────────────────────
// /api/support/chat — چت آنلاین پشتیبانی، سمت کاربر (DECISION-049)
//   GET  : بارگذاری کامل (سشن‌های قابل‌مشاهده + خوش‌آمد + وضعیت + presence) — read را mark می‌کند
//   POST : ارسال پیام کاربر (PRO-only، فقط داخل ساعت کاری)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getNow } from "@/lib/dev/time";
import { prisma } from "@/lib/db/client";
import { planAllows } from "@/lib/plans/access";
import { LIVE_CHAT_FEATURE_KEY, SUPPORT_CHAT_LIMITS } from "@/lib/support/chat";
import { getSupportChatStatus, getSupportWelcome } from "@/lib/support/availability";
import {
  buildVisibleSessions,
  markAdminMessagesReadByUser,
  getOrCreateTodaySession,
} from "@/lib/support/chat-server";

export const dynamic = "force-dynamic";

function welcomeName(displayName: string | null | undefined): string {
  const n = displayName?.trim();
  return n && n.length > 0 ? n : "کاربر همسو";
}

// ─── GET — بارگذاری کامل ──────────────────────────────────────────────────────
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const now = getNow();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { plan: true, displayName: true, supportChatHiddenUntil: true },
  });
  const plan = dbUser?.plan ?? "FREE";

  // گیت PRO — غیرپرو پاسخِ موفق با allowed:false می‌گیرد (UI کارت ارتقا نشان می‌دهد)
  if (!(await planAllows(plan, LIVE_CHAT_FEATURE_KEY))) {
    return NextResponse.json({ ok: true, allowed: false });
  }

  const hiddenUntil = dbUser?.supportChatHiddenUntil ?? null;
  const [status, welcome, sessions] = await Promise.all([
    getSupportChatStatus(now),
    getSupportWelcome(welcomeName(dbUser?.displayName)),
    buildVisibleSessions(user.userId, hiddenUntil, now),
  ]);

  // باز شدن پنجره = کاربر پیام‌های پشتیبان را دید → badge پاک می‌شود
  await markAdminMessagesReadByUser(user.userId, hiddenUntil, now);

  return NextResponse.json({
    ok: true,
    allowed: true,
    availability: status.availability,
    online: status.online,
    withinHours: status.withinHours,
    hours: status.hours,
    welcome,
    sessions,
  });
}

// ─── POST — ارسال پیام کاربر ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: string;
  try {
    const json = await request.json();
    if (typeof json?.content !== "string" || !json.content.trim()) {
      return NextResponse.json({ ok: false, message: "پیام نمی‌تواند خالی باشد" }, { status: 400 });
    }
    body = json.content.trim().slice(0, SUPPORT_CHAT_LIMITS.messageMax);
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }

  const now = getNow();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { plan: true },
  });
  const plan = dbUser?.plan ?? "FREE";

  if (!(await planAllows(plan, LIVE_CHAT_FEATURE_KEY))) {
    return NextResponse.json(
      { ok: false, message: "چت آنلاین پشتیبانی برای پلن شما فعال نیست." },
      { status: 403 }
    );
  }

  // در دسترس بودن: خاموش یا خارج از ساعت کاری → ارسال مجاز نیست (پیام آرام)
  const status = await getSupportChatStatus(now);
  if (status.availability === "disabled") {
    return NextResponse.json(
      { ok: false, message: "چت آنلاین پشتیبانی در حال حاضر غیرفعال است." },
      { status: 409 }
    );
  }
  if (!status.withinHours) {
    return NextResponse.json(
      { ok: false, message: "اکنون خارج از ساعات پاسخگویی هستیم؛ لطفاً در ساعات کاری دوباره پیام بگذارید.", availability: status.availability },
      { status: 409 }
    );
  }

  const session = await getOrCreateTodaySession(user.userId, now);
  const msg = await prisma.supportChatMessage.create({
    data: { sessionId: session.id, authorType: "user", body },
  });
  await prisma.supportChatSession.update({
    where: { id: session.id },
    data: { lastUserAt: now },
  });

  return NextResponse.json({
    ok: true,
    message: {
      id: msg.id,
      authorType: "user" as const,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
