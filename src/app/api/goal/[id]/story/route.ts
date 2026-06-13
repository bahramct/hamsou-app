// ─────────────────────────────────────────────────────────────────────────────
// /api/goal/[id]/story — افزودنِ استوریِ روایی به مسیرِ هدف (DECISION-082)
//   POST { content, mood?, dateIso? } — date پیش‌فرض امروز؛ در بازهٔ [شروع, امروز].
// هر روز فقط یک استوری مجاز است — استوری موجود قابل‌ویرایش است (برخلاف DailyEntry که قفل می‌شود).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { isoToDbDate, isGoalMood } from "@/lib/goal/server";
import { goalToday } from "@/lib/goal/dates";

type Ctx = { params: Promise<{ id: string }> };

const MAX_STORY = 4000;

export async function POST(request: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.userId)
    return NextResponse.json({ ok: false, message: "هدف یافت نشد." }, { status: 404 });
  if (goal.status !== "active")
    return NextResponse.json({ ok: false, message: "این هدف دیگر فعال نیست." }, { status: 400 });

  let body: Record<string, unknown> | null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }

  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return NextResponse.json({ ok: false, message: "چیزی بنویس." }, { status: 400 });
  if (content.length > MAX_STORY)
    return NextResponse.json({ ok: false, message: "متن خیلی بلند است." }, { status: 400 });

  const mood = isGoalMood(body?.mood) ? (body.mood as string) : null;

  const today = goalToday();
  let date = today;
  if (typeof body?.dateIso === "string") {
    const d = isoToDbDate(body.dateIso);
    if (!d) return NextResponse.json({ ok: false, message: "تاریخ نامعتبر است." }, { status: 400 });
    date = d;
  }
  // بازهٔ مجاز: از شروعِ هدف تا امروز (نه آینده، نه قبل از شروع)
  if (date.getTime() < goal.startDate.getTime() || date.getTime() > today.getTime())
    return NextResponse.json(
      { ok: false, message: "تاریخ باید در بازهٔ هدف و حداکثر تا امروز باشد." },
      { status: 400 }
    );

  // هر روز فقط یک استوری مجاز است
  const existing = await prisma.goalStory.findFirst({
    where: { goalId: goal.id, date },
    select: { id: true },
  });
  if (existing)
    return NextResponse.json(
      { ok: false, message: "برای این روز استوری ثبت شده — می‌توانی همان را ویرایش کنی." },
      { status: 409 }
    );

  const story = await prisma.goalStory.create({
    data: { goalId: goal.id, userId: user.userId, date, content, mood },
  });

  return NextResponse.json({ ok: true, storyId: story.id });
}
