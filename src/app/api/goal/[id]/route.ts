// ─────────────────────────────────────────────────────────────────────────────
// /api/goal/[id] — ویرایش/پایان/رهاکردنِ هدف (DECISION-082)
//   PATCH { action }: "edit" (title/endIso) | "complete" | "abandon"
// مالکیت با userId تضمین می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { isoToDbDate } from "@/lib/goal/server";
import { goalToday } from "@/lib/goal/dates";

type Ctx = { params: Promise<{ id: string }> };

const MAX_TITLE = 120;

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

  if (action === "complete" || action === "abandon") {
    await prisma.goal.update({
      where: { id },
      data: { status: action === "complete" ? "completed" : "abandoned" },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "edit") {
    if (goal.status !== "active")
      return NextResponse.json({ ok: false, message: "فقط هدفِ فعال قابل ویرایش است." }, { status: 400 });

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
      data.endDate = end;
    }

    if (Object.keys(data).length === 0)
      return NextResponse.json({ ok: false, message: "چیزی برای تغییر نیست." }, { status: 400 });

    await prisma.goal.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, message: "اکشن نامعتبر." }, { status: 400 });
}
