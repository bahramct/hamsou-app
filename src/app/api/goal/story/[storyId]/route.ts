// ─────────────────────────────────────────────────────────────────────────────
// /api/goal/story/[storyId] — ویرایش/حذفِ استوری (DECISION-082)
//   PATCH  { content?, mood? }
//   DELETE
// مالکیت با userId روی استوری تضمین می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { isGoalMood } from "@/lib/goal/server";

type Ctx = { params: Promise<{ storyId: string }> };

const MAX_STORY = 4000;

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { storyId } = await params;
  const story = await prisma.goalStory.findUnique({ where: { id: storyId } });
  if (!story || story.userId !== user.userId)
    return NextResponse.json({ ok: false, message: "استوری یافت نشد." }, { status: 404 });

  let body: Record<string, unknown> | null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }

  const data: { content?: string; mood?: string | null } = {};

  if (typeof body?.content === "string") {
    const c = body.content.trim();
    if (!c) return NextResponse.json({ ok: false, message: "متن نمی‌تواند خالی باشد." }, { status: 400 });
    if (c.length > MAX_STORY)
      return NextResponse.json({ ok: false, message: "متن خیلی بلند است." }, { status: 400 });
    data.content = c;
  }
  if ("mood" in (body ?? {})) {
    data.mood = isGoalMood(body?.mood) ? (body!.mood as string) : null;
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ ok: false, message: "چیزی برای تغییر نیست." }, { status: 400 });

  await prisma.goalStory.update({ where: { id: storyId }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { storyId } = await params;
  const story = await prisma.goalStory.findUnique({ where: { id: storyId } });
  if (!story || story.userId !== user.userId)
    return NextResponse.json({ ok: false, message: "استوری یافت نشد." }, { status: 404 });

  await prisma.goalStory.delete({ where: { id: storyId } });
  return NextResponse.json({ ok: true });
}
