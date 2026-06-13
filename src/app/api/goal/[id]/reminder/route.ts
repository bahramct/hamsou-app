// ─────────────────────────────────────────────────────────────────────────────
// /api/goal/[id]/reminder — کانفیگِ یادآوریِ هدف (DECISION-082؛ opt-in طبق DECISION-023)
//   PUT { enabled, times[], channel, customMessage? }
// زمان‌بندِ واقعی در /api/cron/reminders اجرا می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { isReminderChannel } from "@/lib/goal/server";

type Ctx = { params: Promise<{ id: string }> };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_TIMES = 3;
const MAX_MSG = 200;

export async function PUT(request: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!goal || goal.userId !== user.userId)
    return NextResponse.json({ ok: false, message: "هدف یافت نشد." }, { status: 404 });

  let body: Record<string, unknown> | null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }

  const enabled = body?.enabled === true;
  const channel = isReminderChannel(body?.channel) ? (body!.channel as string) : "inapp";

  // ساعت‌ها: یکتا، معتبر، مرتب، حداکثر ۳
  const rawTimes = Array.isArray(body?.times) ? (body!.times as unknown[]) : [];
  const times = Array.from(
    new Set(
      rawTimes
        .filter((t): t is string => typeof t === "string" && TIME_RE.test(t))
        .map((t) => t)
    )
  )
    .sort()
    .slice(0, MAX_TIMES);

  if (enabled && times.length === 0)
    return NextResponse.json(
      { ok: false, message: "برای فعال‌کردنِ یادآوری حداقل یک ساعت انتخاب کن." },
      { status: 400 }
    );

  let customMessage: string | null = null;
  if (typeof body?.customMessage === "string") {
    const m = body.customMessage.trim().slice(0, MAX_MSG);
    customMessage = m.length > 0 ? m : null;
  }

  const timesCsv = times.join(",");

  await prisma.goalReminder.upsert({
    where: { goalId: goal.id },
    create: {
      goalId: goal.id,
      userId: user.userId,
      enabled,
      times: timesCsv,
      channel,
      customMessage,
    },
    update: { enabled, times: timesCsv, channel, customMessage },
  });

  return NextResponse.json({ ok: true });
}
