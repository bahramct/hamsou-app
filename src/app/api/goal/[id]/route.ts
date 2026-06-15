// ─────────────────────────────────────────────────────────────────────────────
// /api/goal/[id] — ویرایش/رها/حذفِ هدف (DECISION-082)
//   PATCH { action: "edit", title?, endIso? } — فقط روزِ اول (dayNumber ≤ ۱)
//   PATCH { action: "abandon" }              — نگه‌داری در تاریخچه با وضعیتِ abandoned
//   DELETE                                   — حذفِ کامل (cascade همهٔ استوری/بینش/یادآوری)
// مالکیت با userId تضمین می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { isoToDbDate } from "@/lib/goal/server";
import { goalToday, currentDayNumber, MS_PER_DAY } from "@/lib/goal/dates";

type Ctx = { params: Promise<{ id: string }> };

const MAX_TITLE = 120;
const MAX_RANGE_DAYS = 30; // هماهنگ با ساختِ هدف/چالش (TASK-28 فاز ۲)

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.userId)
    return NextResponse.json({ ok: false, message: "هدف یافت نشد." }, { status: 404 });

  let body: Record<string, unknown> | null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }
  const action = body?.action;

  // ── رها کردن (نگه‌داری در تاریخچه با وضعیتِ abandoned) ─────────────────────
  if (action === "abandon") {
    if (goal.status !== "active")
      return NextResponse.json({ ok: false, message: "هدفِ فعال نیست." }, { status: 400 });
    await prisma.goal.update({
      where: { id },
      data: { status: "abandoned" },
    });
    return NextResponse.json({ ok: true });
  }

  // ── ویرایش (فقط روزِ اول) ────────────────────────────────────────────────
  if (action === "edit") {
    if (goal.status !== "active")
      return NextResponse.json({ ok: false, message: "فقط هدفِ فعال قابل ویرایش است." }, { status: 400 });

    const dayNum = currentDayNumber(goal.startDate, goalToday());
    if (dayNum > 1)
      return NextResponse.json(
        { ok: false, message: "پس از روزِ اول، هدف قابل ویرایش نیست." },
        { status: 403 }
      );

    const data: { title?: string; endDate?: Date } = {};

    if (typeof body?.title === "string") {
      const t = body.title.trim();
      if (!t) return NextResponse.json({ ok: false, message: "عنوان نمی‌تواند خالی باشد." }, { status: 400 });
      if (t.length > MAX_TITLE)
        return NextResponse.json({ ok: false, message: "عنوان خیلی بلند است." }, { status: 400 });
      data.title = t;
    }

    if (typeof body?.endIso === "string") {
      const end = isoToDbDate(body.endIso);
      if (!end) return NextResponse.json({ ok: false, message: "تاریخ پایان نامعتبر است." }, { status: 400 });
      if (end.getTime() <= goal.startDate.getTime())
        return NextResponse.json({ ok: false, message: "پایان باید بعد از شروع باشد." }, { status: 400 });
      if (end.getTime() < goalToday().getTime())
        return NextResponse.json({ ok: false, message: "پایان نمی‌تواند در گذشته باشد." }, { status: 400 });
      const rangeDays = Math.round((end.getTime() - goal.startDate.getTime()) / MS_PER_DAY) + 1;
      if (rangeDays > MAX_RANGE_DAYS)
        return NextResponse.json({ ok: false, message: "بازهٔ یک هدف یا چالش حداکثر ۳۰ روز است." }, { status: 400 });
      data.endDate = end;
    }

    if (Object.keys(data).length === 0)
      return NextResponse.json({ ok: false, message: "چیزی برای تغییر نیست." }, { status: 400 });

    await prisma.goal.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, message: "اکشن نامعتبر." }, { status: 400 });
}

// ── حذفِ کامل — cascade تمامِ استوری/بینش/یادآوریِ هدف را پاک می‌کند ──────────
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!goal || goal.userId !== user.userId)
    return NextResponse.json({ ok: false, message: "هدف یافت نشد." }, { status: 404 });

  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
