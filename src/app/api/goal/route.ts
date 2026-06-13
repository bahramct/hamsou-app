// ─────────────────────────────────────────────────────────────────────────────
// /api/goal — فیچر «برنامه‌ریزی» (DECISION-082)
//   GET  : نمای هدفِ فعال + استوری‌ها + بینش‌ها + کانفیگِ یادآوری + وضعیتِ همراه
//   POST : ساختِ هدفِ جدید (گاردِ ساختاری: فقط یک هدفِ فعال؛ شروع ≥ امروز؛ پایان > شروع)
// گیت: goal.planning (پیش‌فرض برای همه باز است).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { planAllows } from "@/lib/plans/access";
import { getEffectivePlanKey } from "@/lib/plans/effective";
import { loadActiveGoalView, isoToDbDate } from "@/lib/goal/server";
import { goalToday, MS_PER_DAY } from "@/lib/goal/dates";

const MAX_TITLE = 120;
const MAX_RANGE_DAYS = 365;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const view = await loadActiveGoalView(user.userId);
  return NextResponse.json({ ok: true, ...view });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const plan = await getEffectivePlanKey(user.userId);
  if (!(await planAllows(plan, "goal.planning"))) {
    return NextResponse.json(
      { ok: false, message: "این بخش در پلن فعلی شما در دسترس نیست." },
      { status: 403 }
    );
  }

  let body: Record<string, unknown> | null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const startIso = typeof body?.startIso === "string" ? body.startIso : "";
  const endIso = typeof body?.endIso === "string" ? body.endIso : "";

  if (!title) return NextResponse.json({ ok: false, message: "عنوان هدف را بنویس." }, { status: 400 });
  if (title.length > MAX_TITLE)
    return NextResponse.json({ ok: false, message: "عنوان هدف خیلی بلند است." }, { status: 400 });

  const start = isoToDbDate(startIso);
  const end = isoToDbDate(endIso);
  if (!start || !end)
    return NextResponse.json({ ok: false, message: "تاریخ نامعتبر است." }, { status: 400 });

  const today = goalToday();
  if (start.getTime() < today.getTime())
    return NextResponse.json(
      { ok: false, message: "تاریخ شروع نمی‌تواند قبل از امروز باشد." },
      { status: 400 }
    );
  if (end.getTime() <= start.getTime())
    return NextResponse.json(
      { ok: false, message: "تاریخ پایان باید بعد از تاریخ شروع باشد." },
      { status: 400 }
    );
  const rangeDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  if (rangeDays > MAX_RANGE_DAYS)
    return NextResponse.json(
      { ok: false, message: "بازهٔ هدف بیش از حد طولانی است." },
      { status: 400 }
    );

  // گاردِ ساختاری: فقط یک هدفِ فعال در لحظه (DECISION-082)
  const existing = await prisma.goal.findFirst({
    where: { userId: user.userId, status: "active" },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { ok: false, message: "همین حالا یک هدفِ فعال داری. اول آن را به پایان برسان یا رها کن." },
      { status: 409 }
    );
  }

  const goal = await prisma.goal.create({
    data: { userId: user.userId, title, startDate: start, endDate: end, status: "active" },
  });

  return NextResponse.json({ ok: true, goalId: goal.id });
}
