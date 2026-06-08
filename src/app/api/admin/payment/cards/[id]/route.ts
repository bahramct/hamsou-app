// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/payment/cards/[id] — ویرایش + حذف کارتِ مرجع (DECISION-062)
//   PATCH / DELETE — enforce payment.manage
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { invalidateBankCardCache } from "@/lib/payment/cards";
import { onlyDigits } from "@/lib/utils/digits";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "payment.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.bankCard.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "کارت یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof b.holderName === "string") {
    if (!b.holderName.trim()) return NextResponse.json({ error: "نام صاحب کارت خالی است." }, { status: 400 });
    data.holderName = b.holderName.trim();
  }
  if (typeof b.cardNumber === "string") {
    const cn = onlyDigits(b.cardNumber);
    if (cn.length !== 16) return NextResponse.json({ error: "شماره کارت باید ۱۶ رقم باشد." }, { status: 400 });
    data.cardNumber = cn;
  }
  if (typeof b.bankName === "string") {
    if (!b.bankName.trim()) return NextResponse.json({ error: "نام بانک خالی است." }, { status: 400 });
    data.bankName = b.bankName.trim();
  }
  if (typeof b.note === "string") data.note = b.note.trim() || null;
  if (typeof b.isActive === "boolean") data.isActive = b.isActive;

  const willBeDefault = b.isDefault === true;

  const updated = await prisma.$transaction(async (db) => {
    if (willBeDefault) {
      await db.bankCard.updateMany({ where: { isDefault: true, NOT: { id } }, data: { isDefault: false } });
      data.isDefault = true;
    } else if (b.isDefault === false) {
      data.isDefault = false;
    }
    return db.bankCard.update({ where: { id }, data });
  });

  invalidateBankCardCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "payment.card.update",
    targetType: "bank-card",
    targetId: id,
    meta: { keys: Object.keys(data) },
  });

  return NextResponse.json({ ok: true, id: updated.id });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "payment.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.bankCard.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "کارت یافت نشد." }, { status: 404 });

  await prisma.bankCard.delete({ where: { id } });
  invalidateBankCardCache();

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "payment.card.delete",
    targetType: "bank-card",
    targetId: id,
    meta: { holderName: existing.holderName },
  });

  return NextResponse.json({ ok: true });
}
