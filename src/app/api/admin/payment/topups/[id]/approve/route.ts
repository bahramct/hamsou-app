// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/payment/topups/[id]/approve — تأیید شارژ (DECISION-062)
//   body: { amount? } — اصلاحِ مبلغ توسط ادمین (اختیاری). enforce payment.manage.
//   موجودی را اتمیک شارژ می‌کند + اعلان به کاربر. idempotent (گارد status).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { approveTopup } from "@/lib/wallet/wallet";
import { createNotification } from "@/lib/notifications/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "payment.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const b = (await req.json().catch(() => null)) as { amount?: unknown } | null;
  const amountOverride =
    typeof b?.amount === "number" && b.amount > 0 ? Math.floor(b.amount) : undefined;

  const result = await approveTopup(id, ctx.admin.id, amountOverride);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  await createNotification({
    userId: result.userId,
    type: "wallet.topup.approved",
    data: { amount: result.amount, balanceAfter: result.balanceAfter, refCode: result.refCode, txId: id },
  });
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "wallet.topup.approve",
    targetType: "wallet-topup",
    targetId: id,
    meta: { amount: result.amount, userId: result.userId },
  });

  return NextResponse.json({ ok: true, amount: result.amount, balanceAfter: result.balanceAfter });
}
