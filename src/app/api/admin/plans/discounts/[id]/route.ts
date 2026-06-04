// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/plans/discounts/[id] — ویرایش + حذف کد تخفیف (DECISION-040)
//   PATCH  : ویرایش (فیلدهای آمده) — enforce plans.write
//   DELETE : حذف — enforce plans.write
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { parseDiscountBody } from "@/lib/plans/discount-shared";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "plans.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "کد یافت نشد." }, { status: 404 });

  const parsed = parseDiscountBody(await req.json().catch(() => null), { requireCode: false });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;

  // اگر کد تغییر کرد، یکتایی را چک کن
  if (d.code && d.code !== existing.code) {
    const dup = await prisma.discountCode.findUnique({ where: { code: d.code } });
    if (dup) return NextResponse.json({ error: "این کد قبلاً ثبت شده است." }, { status: 400 });
  }

  // اگر kind به percent تغییر کرد ولی value نیامد، اعتبار value فعلی را با kind جدید بررسی کن
  const data: Record<string, unknown> = {};
  if (d.code !== undefined) data.code = d.code;
  if (d.kind !== undefined) data.kind = d.kind;
  if (d.value !== undefined) data.value = d.value;
  if (d.plans !== undefined) data.plans = d.plans;
  if (d.cycles !== undefined) data.cycles = d.cycles;
  if (d.maxUses !== undefined) data.maxUses = d.maxUses;
  if (d.startsAt !== undefined) data.startsAt = d.startsAt;
  if (d.expiresAt !== undefined) data.expiresAt = d.expiresAt;
  if (d.isActive !== undefined) data.isActive = d.isActive;
  if (d.note !== undefined) data.note = d.note;

  await prisma.discountCode.update({ where: { id }, data });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "discount.update",
    targetType: "discount",
    targetId: id,
    meta: { keys: Object.keys(data) },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "plans.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "کد یافت نشد." }, { status: 404 });

  await prisma.discountCode.delete({ where: { id } });
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "discount.delete",
    targetType: "discount",
    targetId: id,
    meta: { code: existing.code },
  });

  return NextResponse.json({ ok: true });
}
