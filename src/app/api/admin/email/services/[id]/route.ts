// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/email/services/[id] — مشاهده + ویرایش + حذف یک سرویس ایمیل
//   GET    : اطلاعات سرویس (بدون apiKey) — email.read
//   PATCH  : ویرایش — email.manage
//   DELETE : حذف (فقط اگر پیش‌فرض نباشد) — email.manage
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can, isOwner } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { invalidateEmailServiceCache } from "@/lib/email/services";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "email.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const svc = await prisma.emailService.findUnique({ where: { id } });
  if (!svc) return NextResponse.json({ error: "سرویس یافت نشد." }, { status: 404 });

  return NextResponse.json({
    ok: true,
    service: {
      id: svc.id,
      label: svc.label,
      provider: svc.provider,
      fromAddress: svc.fromAddress,
      fromName: svc.fromName,
      isActive: svc.isActive,
      isDefault: svc.isDefault,
      hasKey: Boolean(svc.apiKey && svc.apiKey.trim()),
      note: svc.note,
      // apiKey فقط برای Owner از مسیر /key
    },
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "email.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const svc = await prisma.emailService.findUnique({ where: { id } });
  if (!svc) return NextResponse.json({ error: "سرویس یافت نشد." }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.label === "string" && body.label.trim()) updates.label = body.label.trim();
  if (typeof body.fromAddress === "string" && body.fromAddress.trim()) updates.fromAddress = body.fromAddress.trim();
  if (typeof body.fromName === "string" && body.fromName.trim()) updates.fromName = body.fromName.trim();
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
  if (typeof body.note === "string") updates.note = body.note.trim() || null;
  // apiKey فقط Owner می‌تواند تغییر بدهد — از مسیر /key
  if (typeof body.apiKey === "string" && isOwner(ctx)) {
    updates.apiKey = body.apiKey.trim() || null;
  }

  await prisma.$transaction(async (tx) => {
    if (body.isDefault === true && !svc.isDefault) {
      await tx.emailService.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
      updates.isDefault = true;
    } else if (body.isDefault === false) {
      updates.isDefault = false;
    }
    await tx.emailService.update({ where: { id }, data: updates });
  });

  invalidateEmailServiceCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "email.service.update",
    targetType: "email-service",
    targetId: id,
    meta: { fields: Object.keys(updates).filter((k) => k !== "apiKey") },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "email.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const svc = await prisma.emailService.findUnique({ where: { id } });
  if (!svc) return NextResponse.json({ error: "سرویس یافت نشد." }, { status: 404 });
  if (svc.isDefault) {
    return NextResponse.json({ error: "سرویس پیش‌فرض را نمی‌توانی حذف کنی. ابتدا سرویس دیگری را پیش‌فرض کن." }, { status: 400 });
  }

  await prisma.emailService.delete({ where: { id } });
  invalidateEmailServiceCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "email.service.delete",
    targetType: "email-service",
    targetId: id,
    meta: { label: svc.label },
  });

  return NextResponse.json({ ok: true });
}
