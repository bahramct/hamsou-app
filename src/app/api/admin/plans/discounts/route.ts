// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/plans/discounts — فهرست + ساخت کد تخفیف (DECISION-040)
//   GET  : فهرست همهٔ کدها — enforce plans.read
//   POST : ساخت کد جدید — enforce plans.write
// مصرف واقعی موکول به درگاه پرداخت؛ اینجا فقط تعریف/مدیریت.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { parseDiscountBody, serializeDiscount } from "@/lib/plans/discount-shared";

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "plans.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, codes: codes.map(serializeDiscount) });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "plans.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = parseDiscountBody(body, { requireCode: true });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;

  // یکتایی کد
  const exists = await prisma.discountCode.findUnique({ where: { code: d.code! } });
  if (exists) return NextResponse.json({ error: "این کد قبلاً ثبت شده است." }, { status: 400 });

  const created = await prisma.discountCode.create({
    data: {
      code: d.code!,
      kind: d.kind!,
      value: d.value!,
      plans: d.plans ?? "",
      cycles: d.cycles ?? "",
      maxUses: d.maxUses ?? null,
      startsAt: d.startsAt ?? null,
      expiresAt: d.expiresAt ?? null,
      isActive: d.isActive ?? true,
      note: d.note ?? null,
      createdById: ctx.admin.id,
    },
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "discount.create",
    targetType: "discount",
    targetId: created.id,
    meta: { code: created.code, kind: created.kind, value: created.value },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
