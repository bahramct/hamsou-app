// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/payment/topups/[id]/reject — رد شارژ (DECISION-062)
//   body: { reason } — enforce payment.manage. اعلان به کاربر. idempotent (گارد status).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { rejectTopup } from "@/lib/wallet/wallet";
import { createNotification } from "@/lib/notifications/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "payment.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const b = (await req.json().catch(() => null)) as { reason?: unknown } | null;
  const reason = typeof b?.reason === "string" ? b.reason.trim() : "";

  const result = await rejectTopup(id, ctx.admin.id, reason);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  if (result.userId) {
    await createNotification({
      userId: result.userId,
      type: "wallet.topup.rejected",
      data: { reason: reason || null, txId: id },
    });
  }
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "wallet.topup.reject",
    targetType: "wallet-topup",
    targetId: id,
    meta: { reason },
  });

  return NextResponse.json({ ok: true });
}
