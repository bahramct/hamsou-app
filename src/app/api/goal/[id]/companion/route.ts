// ─────────────────────────────────────────────────────────────────────────────
// /api/goal/[id]/companion — راهنماییِ «همراه» (کوچ AI، DECISION-082)
//   POST : تولیدِ بینشِ امروز — Pro، روزِ ۳ تا قبل از پایان، یک‌بار در روز
//   GET  : فهرستِ بینش‌های موجود
// قاعدهٔ طلایی: فقط invokeAI (هرگز adapter مستقیم). خطای سرویس → ۵۰۳ محترمانه (DECISION-048).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getCountryFromHeaders } from "@/lib/utils/geo";
import { prisma } from "@/lib/db/client";
import { formatJalali } from "@/lib/utils/date";
import { planAllows } from "@/lib/plans/access";
import { getEffectivePlanKey } from "@/lib/plans/effective";
import { invokeAI } from "@/lib/ai/orchestrator";
import type {
  GoalCompanionInput,
  GoalCompanionOutput,
} from "@/lib/ai/roles/goal-companion/schema";
import { companionWindow, todayKey } from "@/lib/goal/dates";
import { serializeInsight } from "@/lib/goal/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!goal || goal.userId !== user.userId)
    return NextResponse.json({ ok: false, message: "هدف یافت نشد." }, { status: 404 });

  const insights = await prisma.goalCompanionInsight.findMany({
    where: { goalId: id },
    orderBy: { dayNumber: "asc" },
  });
  return NextResponse.json({ ok: true, insights: insights.map((i) => serializeInsight(i)) });
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.userId)
    return NextResponse.json({ ok: false, message: "هدف یافت نشد." }, { status: 404 });
  if (goal.status !== "active")
    return NextResponse.json({ ok: false, message: "این هدف دیگر فعال نیست." }, { status: 400 });

  // ── گیتِ پلن: «همراه» فقط پرو (یا هر پلنی که owner از پنل روشن کند) ──────────
  const plan = await getEffectivePlanKey(user.userId);
  if (!(await planAllows(plan, "goal.companion"))) {
    return NextResponse.json(
      { ok: false, message: "راهنماییِ «همراه» مخصوصِ پلن پرو است.", upsell: true },
      { status: 403 }
    );
  }

  // ── پنجرهٔ زمانی: روزِ سوم تا قبل از پایان ─────────────────────────────────
  const win = companionWindow(goal.startDate, goal.endDate);
  if (!win.available) {
    const msg =
      win.reason === "before_day_3"
        ? "راهنماییِ «همراه» از روزِ سومِ مسیر در دسترس است."
        : "مسیرِ این هدف به پایان رسیده — راهنماییِ تازه‌ای نیست.";
    return NextResponse.json({ ok: false, message: msg }, { status: 403 });
  }

  // ── سقفِ ساختاری: یک‌بار در روز ────────────────────────────────────────────
  const dayKey = todayKey();
  const existing = await prisma.goalCompanionInsight.findUnique({
    where: { goalId_dayKey: { goalId: goal.id, dayKey } },
  });
  if (existing) {
    return NextResponse.json(
      { ok: false, message: "امروز راهنماییِ «همراه» را گرفته‌ای — فردا دوباره.", insight: serializeInsight(existing) },
      { status: 409 }
    );
  }

  // ── ساختِ ورودیِ نقش ───────────────────────────────────────────────────────
  const [stories, recentEntries, recentChat] = await Promise.all([
    prisma.goalStory.findMany({
      where: { goalId: goal.id },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.dailyEntry.findMany({
      where: { userId: user.userId },
      include: { feedback: true },
      orderBy: { date: "desc" },
      take: 14,
    }),
    prisma.chatMessage.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const input: GoalCompanionInput = {
    goalTitle: goal.title,
    startJalali: formatJalali(goal.startDate),
    endJalali: formatJalali(goal.endDate),
    dayNumber: win.dayNumber,
    totalDays: win.totalDays,
    stories: stories.map((s) => ({
      jalaliDate: formatJalali(s.date),
      content: s.content,
      mood: s.mood,
    })),
    recentCommitments: recentEntries
      .reverse()
      .map((e) => ({
        jalaliDate: formatJalali(e.date),
        content: e.content,
        feedbackStatus: (e.feedback?.status as "DONE" | "NOT_DONE" | null) ?? null,
      })),
    weeklySignal: null,
    recentChat:
      recentChat.length > 0
        ? recentChat
            .reverse()
            .map((m) => (m.role === "user" ? `کاربر: ${m.content}` : `همدم: ${m.content}`))
            .join("\n")
        : null,
  };

  let result;
  try {
    const clientCountry = getCountryFromHeaders(request.headers);
    result = await invokeAI<GoalCompanionInput, GoalCompanionOutput>("goal-companion", input, {
      userId: user.userId,
      locale: "fa",
      clientCountry,
    });
  } catch (err) {
    console.error("[goal-companion] فراخوانی AI ناموفق:", err);
    return NextResponse.json(
      { ok: false, message: "«همراه» الان در دسترس نیست — لطفاً کمی بعد دوباره تلاش کن." },
      { status: 503 }
    );
  }

  const insight = await prisma.goalCompanionInsight.create({
    data: {
      goalId: goal.id,
      userId: user.userId,
      dayKey,
      dayNumber: win.dayNumber,
      aiContent: JSON.stringify(result.output),
    },
  });

  return NextResponse.json({ ok: true, insight: serializeInsight(insight) });
}
