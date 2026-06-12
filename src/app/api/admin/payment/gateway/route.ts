// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/payment/gateway — تنظیمِ درگاهِ پرداختِ آنلاین (DECISION-071)
//   GET : کانفیگِ درگاه (merchantId فقط برای Owner؛ بقیه hasMerchantId)
//   PUT : ساخت/ویرایشِ تک‌ردیفِ درگاه (upsert) — merchantId فقط Owner تغییر می‌دهد
// enforce: payment.read (GET) / payment.manage (PUT)؛ کلیدِ درگاه: فقط Owner
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can, isOwner } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { invalidatePaymentGatewayCache } from "@/lib/payment/gateway";

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "payment.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const gw = await prisma.paymentGateway.findFirst({
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({
    ok: true,
    gateway: gw
      ? {
          id: gw.id,
          label: gw.label,
          provider: gw.provider,
          isSandbox: gw.isSandbox,
          isActive: gw.isActive,
          hasMerchantId: Boolean(gw.merchantId && gw.merchantId.trim()),
          merchantId: isOwner(ctx) ? gw.merchantId : null, // مقدارِ واقعی فقط Owner
          note: gw.note,
        }
      : null,
    isOwner: isOwner(ctx),
  });
}

export async function PUT(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "payment.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.label === "string" && body.label.trim()) data.label = body.label.trim();
  if (body.provider === "zarinpal" || body.provider === "mock") data.provider = body.provider;
  if (typeof body.isSandbox === "boolean") data.isSandbox = body.isSandbox;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.note === "string") data.note = body.note.trim() || null;
  // merchantId فقط Owner تغییر می‌دهد
  if (typeof body.merchantId === "string" && isOwner(ctx)) {
    data.merchantId = body.merchantId.trim() || null;
  }

  const existing = await prisma.paymentGateway.findFirst({
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  let id: string;
  if (existing) {
    await prisma.paymentGateway.update({ where: { id: existing.id }, data: { ...data, isDefault: true } });
    id = existing.id;
  } else {
    const created = await prisma.paymentGateway.create({
      data: {
        label: (data.label as string) ?? "زرین‌پال",
        provider: (data.provider as string) ?? "zarinpal",
        merchantId: (data.merchantId as string | null) ?? null,
        isSandbox: (data.isSandbox as boolean) ?? false,
        isActive: (data.isActive as boolean) ?? true,
        isDefault: true,
        note: (data.note as string | null) ?? null,
        createdById: ctx.admin.id,
      },
    });
    id = created.id;
  }

  invalidatePaymentGatewayCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "payment.gateway.update",
    targetType: "payment-gateway",
    targetId: id,
    meta: { fields: Object.keys(data).filter((k) => k !== "merchantId") },
  });

  return NextResponse.json({ ok: true });
}
