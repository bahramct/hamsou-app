// POST /api/admin/users/[id]/plan  — تغییر پلن کاربر (enforce: users.plan.write)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { isUserPlan } from "@/constants/plans";
import { createNotification } from "@/lib/notifications/server";
import { getNow } from "@/lib/dev/time";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "users.plan.write")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const plan: unknown = body?.plan;

  if (!isUserPlan(plan)) {
    return NextResponse.json({ error: "پلن نامعتبر است." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, plan: true } });
  if (!user) return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });

  if (user.plan === plan) {
    return NextResponse.json({ ok: true, plan });
  }

  // planPaidSince: ارتقا از FREE → تنظیم؛ تنزل به FREE → پاک کردن؛ بین پلن‌های پولی → دست نزن
  const planPaidUpdate: { planPaidSince?: Date | null } = {};
  if (user.plan === "FREE" && plan !== "FREE") {
    planPaidUpdate.planPaidSince = getNow();
  } else if (plan === "FREE") {
    planPaidUpdate.planPaidSince = null;
  }

  await prisma.user.update({ where: { id }, data: { plan, ...planPaidUpdate } });
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "user.plan.change",
    targetType: "user",
    targetId: id,
    meta: { from: user.plan, to: plan },
  });

  // اعلان به کاربر — تغییر پلن (parity ادمین↔پروژه، DECISION-046)
  const planRow = await prisma.plan.findUnique({ where: { key: plan }, select: { label: true } });
  await createNotification({
    userId: id,
    type: "plan.changed",
    data: { plan, planLabel: planRow?.label ?? plan },
  });

  return NextResponse.json({ ok: true, plan });
}
