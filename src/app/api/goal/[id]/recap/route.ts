// ─────────────────────────────────────────────────────────────────────────────
// /api/goal/[id]/recap — «بازخوانیِ سفر» (TASK-28 فاز ۳) — فقط‌خواندنی.
// روزهای دارای استوری یا بینشِ همراه را به‌ترتیبِ زمانی بافته برمی‌گرداند.
// مالکیت با userId تضمین می‌شود. بدونِ AIِ جدید — فقط دادهٔ موجود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { formatJalali, formatWeekday } from "@/lib/utils/date";
import { currentDayNumber, totalDays } from "@/lib/goal/dates";
import { iranDayKey } from "@/lib/goal/dates";
import { isGoalMood, isoToDbDate, normalizeGoalType, serializeInsight } from "@/lib/goal/server";
import type { JourneyRecapDay } from "@/types/goal";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.userId)
    return NextResponse.json({ ok: false, message: "مسیر یافت نشد." }, { status: 404 });

  const [stories, insights] = await Promise.all([
    prisma.goalStory.findMany({
      where: { goalId: goal.id },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.goalCompanionInsight.findMany({
      where: { goalId: goal.id },
      orderBy: { dayNumber: "asc" },
    }),
  ]);

  // اولین استوری و اولین بینشِ هر روز
  const storyByDay = new Map<string, (typeof stories)[number]>();
  for (const s of stories) {
    const k = iranDayKey(s.date);
    if (!storyByDay.has(k)) storyByDay.set(k, s);
  }
  const insightByDay = new Map<string, (typeof insights)[number]>();
  for (const i of insights) {
    if (!insightByDay.has(i.dayKey)) insightByDay.set(i.dayKey, i);
  }

  // اتحادِ روزها، به‌ترتیبِ زمانی ("YYYY-MM-DD" → مرتب‌سازیِ رشته‌ای کافی است)
  const dayKeys = Array.from(new Set([...storyByDay.keys(), ...insightByDay.keys()])).sort();

  const days: JourneyRecapDay[] = dayKeys.map((k) => {
    const dbDate = isoToDbDate(k)!;
    const s = storyByDay.get(k) ?? null;
    const ins = insightByDay.get(k) ?? null;
    const parsed = ins
      ? serializeInsight({
          id: ins.id,
          dayKey: ins.dayKey,
          dayNumber: ins.dayNumber,
          aiContent: ins.aiContent,
          generatedAt: ins.generatedAt,
        })
      : null;
    return {
      dayNumber: currentDayNumber(goal.startDate, dbDate),
      dateLabel: formatJalali(dbDate),
      weekdayLabel: formatWeekday(dbDate),
      story: s ? { content: s.content, mood: isGoalMood(s.mood) ? s.mood : null } : null,
      insight: parsed ? { reflection: parsed.reflection, suggestions: parsed.suggestions } : null,
    };
  });

  return NextResponse.json({
    ok: true,
    recap: {
      id: goal.id,
      type: normalizeGoalType(goal.type),
      title: goal.title,
      status: goal.status,
      startLabel: formatJalali(goal.startDate),
      endLabel: formatJalali(goal.endDate),
      totalDays: totalDays(goal.startDate, goal.endDate),
      storyCount: stories.length,
      insightCount: insights.length,
      days,
    },
  });
}
