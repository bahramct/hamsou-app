// ─────────────────────────────────────────────────────────────────────────────
// /api/chat/messages — GET (تاریخچه) + POST (ارسال پیام)
//
// GET: آخرین ۵۰ پیام (منقضی‌نشده) + تعداد پیام‌های امروز + سقف و متن خوش‌آمد
// POST: دریافت پیام کاربر، فراخوانی AI، ذخیره هر دو پیام
//   rate limit: سقف پیام روزانه per-plan (FREE/PLUS/PRO) — از config، بر اساس روز ایران
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getCountryFromHeaders } from "@/lib/utils/geo";
import { getNow, nowMs } from "@/lib/dev/time";
import { getTodayDateForDB, formatJalali } from "@/lib/utils/date";
import { prisma } from "@/lib/db/client";
import { invokeAI } from "@/lib/ai/orchestrator";
import type { ChatCompanionInput, ChatCompanionOutput } from "@/lib/ai/roles/chat-companion/schema";
import { getAiConfig, getAiConfigInt } from "@/lib/ai/config";
import {
  AI_CONFIG_KEYS,
  DEFAULT_COMPANION_NAME,
  DEFAULT_CHAT_WELCOME,
  DEFAULT_CHAT_MAX_MESSAGE_LENGTH,
} from "@/lib/ai/admin-catalog";
import { planQuota } from "@/lib/plans/access";

const IRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// شروع روز ایران به UTC — برای محاسبه rate limit
function getIranTodayStartUtc(): Date {
  return new Date(getTodayDateForDB().getTime() - IRAN_OFFSET_MS);
}

// سقف پیام روزانه بر اساس پلن — منبع‌حقیقت واحد: مدیریت پلن‌ها (DECISION-040)
async function getDailyLimitForPlan(plan: string): Promise<number> {
  return planQuota(plan, "chat.dailyLimit");
}

// رندر متن خوش‌آمد از template (override پنل یا پیش‌فرض) با نام و سقف
async function renderWelcome(name: string, limit: number): Promise<string> {
  const template = await getAiConfig(AI_CONFIG_KEYS.chatWelcome, DEFAULT_CHAT_WELCOME);
  return template
    .replace(/\{\{\s*NAME\s*\}\}/g, name)
    .replace(/\{\{\s*LIMIT\s*\}\}/g, limit.toLocaleString("fa-IR"));
}

// ─── GET — تاریخچه پیام‌ها ───────────────────────────────────────────────────
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const now = getNow();

  const [dbUser, messages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.userId },
      select: { plan: true, companionName: true, chatClearedAt: true },
    }),
    prisma.chatMessage.findMany({
      where: { userId: user.userId, expiresAt: { gt: now } },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
  ]);

  const plan = dbUser?.plan ?? "FREE";
  const [dailyLimit, maxMessageLength, companionName] = await Promise.all([
    getDailyLimitForPlan(plan),
    getAiConfigInt(AI_CONFIG_KEYS.chatMaxMessageLength, DEFAULT_CHAT_MAX_MESSAGE_LENGTH),
    dbUser?.companionName
      ? Promise.resolve(dbUser.companionName)
      : getAiConfig(AI_CONFIG_KEYS.companionDefaultName, DEFAULT_COMPANION_NAME),
  ]);

  const clearedAt = dbUser?.chatClearedAt ?? null;
  const visibleMessages = clearedAt
    ? messages.filter((m) => m.createdAt > clearedAt)
    : messages;

  const todayStart = getIranTodayStartUtc();
  const dailyCount = visibleMessages.filter(
    (m) => m.role === "user" && m.createdAt >= todayStart
  ).length;

  return NextResponse.json({
    ok: true,
    messages: visibleMessages.map(serialize),
    dailyCount,
    dailyLimit,
    maxMessageLength,
    welcomeText: await renderWelcome(companionName, dailyLimit),
  });
}

// ─── POST — ارسال پیام و دریافت پاسخ ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Parse body
  let content: string;
  try {
    const body = await request.json();
    if (typeof body?.content !== "string" || !body.content.trim()) {
      return NextResponse.json(
        { ok: false, message: "پیام نمی‌تواند خالی باشد" },
        { status: 400 }
      );
    }
    const maxLen = await getAiConfigInt(AI_CONFIG_KEYS.chatMaxMessageLength, DEFAULT_CHAT_MAX_MESSAGE_LENGTH);
    content = body.content.trim().slice(0, maxLen);
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }

  const now = getNow();
  const todayStart = getIranTodayStartUtc();

  // ── اطلاعات کاربر (شامل پلن برای سقف per-plan) ───────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { companionName: true, displayName: true, plan: true },
  });
  const plan = dbUser?.plan ?? "FREE";

  // ── Rate limit check — سقف بر اساس پلن (DECISION-037) ────────────────────
  const dailyLimit = await getDailyLimitForPlan(plan);
  const todayUserCount = await prisma.chatMessage.count({
    where: {
      userId: user.userId,
      role: "user",
      createdAt: { gte: todayStart },
    },
  });

  if (todayUserCount >= dailyLimit) {
    return NextResponse.json(
      { ok: false, message: "به محدودیت روزانه رسیدی — فردا ادامه می‌دهیم" },
      { status: 429 }
    );
  }

  // ── تاریخچه مکالمه (آخرین ۲۰ پیام برای context AI) ─────────────────────
  const recentHistory = await prisma.chatMessage.findMany({
    where: { userId: user.userId, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const conversationHistory = recentHistory.reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // ── Context: آخرین ۳۰ روز تعهدها ────────────────────────────────────────
  const thirtyDaysAgo = new Date(nowMs() - THIRTY_DAYS_MS);
  const recentEntries = await prisma.dailyEntry.findMany({
    where: { userId: user.userId, date: { gte: thirtyDaysAgo } },
    include: { feedback: true },
    orderBy: { date: "desc" },
    take: 30,
  });

  const contextEntries = recentEntries.map((e) => ({
    jalaliDate: formatJalali(e.date),
    content: e.content,
    feedbackStatus: (e.feedback?.status as "DONE" | "NOT_DONE" | null) ?? null,
  }));

  // ── فراخوانی AI ──────────────────────────────────────────────────────────
  const clientCountry = getCountryFromHeaders(request.headers);
  const companionName =
    dbUser?.companionName ||
    (await getAiConfig(AI_CONFIG_KEYS.companionDefaultName, DEFAULT_COMPANION_NAME));

  let aiResult;
  try {
    aiResult = await invokeAI<ChatCompanionInput, ChatCompanionOutput>(
      "chat-companion",
      {
        companionName,
        userDisplayName: dbUser?.displayName ?? null,
        todayJalali: formatJalali(now),
        contextSnapshot: { recentEntries: contextEntries },
        conversationHistory,
        userMessage: content,
      },
      { userId: user.userId, locale: "fa", clientCountry }
    );
  } catch (err) {
    // DECISION-048: دیگر mockِ نجات‌دهنده نیست — خطای سرویس را محترمانه برگردان
    console.error("[chat] فراخوانی AI ناموفق:", err);
    return NextResponse.json(
      { ok: false, message: "دستیار همدم الان در دسترس نیست — لطفاً کمی بعد دوباره تلاش کن." },
      { status: 503 }
    );
  }

  const reply = aiResult.output.reply;
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

  // ── ذخیره هر دو پیام به‌صورت atomic ────────────────────────────────────
  const [userMsg, assistantMsg] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: { userId: user.userId, role: "user", content, expiresAt },
    }),
    prisma.chatMessage.create({
      data: { userId: user.userId, role: "assistant", content: reply, expiresAt },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    userMessage: serialize(userMsg),
    assistantMessage: serialize(assistantMsg),
  });
}

// ─── Serializer ───────────────────────────────────────────────────────────────
function serialize(m: {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}) {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}
