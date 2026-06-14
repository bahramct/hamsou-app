// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/users/[id]/wallet — شارژ/اصلاحِ دستیِ کیف‌پول (DECISION-089)
//   body: { amount: number (مثبت=شارژ، منفی=کسر), note: string }
//   enforce: payment.manage (اقدامِ مالی). اتمیک با adjustBalance + اعلان به کاربر.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { adjustBalance } from "@/lib/wallet/wallet";
import { createNotification } from "@/lib/notifications/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false, error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "payment.manage")) {
    return NextResponse.json({ ok: false, error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { amount?: unknown; note?: unknown } | null;

  const amount =
    typeof body?.amount === "number" && Number.isInteger(body.amount) ? body.amount : NaN;
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!Number.isInteger(amount) || amount === 0) {
    return NextResponse.json({ ok: false, error: "مبلغ نامعتبر است." }, { status: 400 });
  }
  if (!note) {
    return NextResponse.json({ ok: false, error: "یادداشت (دلیل) اجباری است." }, { status: 400 });
  }
  if (note.length > 200) {
    return NextResponse.json({ ok: false, error: "یادداشت طولانی است." }, { status: 400 });
  }

  const result = await adjustBalance(id, amount, ctx.admin.id, note);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  // اعلان به کاربر (هم‌ترازی + شفافیت، DECISION-046)
  await createNotification({
    userId: id,
    type: "wallet.adjusted",
    data: { amount: result.amount, balanceAfter: result.balanceAfter, refCode: result.refCode, note },
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "wallet.adjust",
    targetType: "user",
    targetId: id,
    meta: { amount: result.amount, balanceAfter: result.balanceAfter, note },
  });

  return NextResponse.json({ ok: true, amount: result.amount, balanceAfter: result.balanceAfter });
}
