// GET/PUT /api/admin/email/services/[id]/key — مشاهده و تغییر apiKey — فقط Owner

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, isOwner } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { invalidateEmailServiceCache } from "@/lib/email/services";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx || !isOwner(ctx)) return NextResponse.json({ error: "فقط مالک سایت دسترسی دارد." }, { status: 403 });
  const { id } = await params;
  const svc = await prisma.emailService.findUnique({ where: { id }, select: { apiKey: true } });
  if (!svc) return NextResponse.json({ error: "سرویس یافت نشد." }, { status: 404 });
  return NextResponse.json({ ok: true, apiKey: svc.apiKey ?? "" });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx || !isOwner(ctx)) return NextResponse.json({ error: "فقط مالک سایت دسترسی دارد." }, { status: 403 });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { apiKey?: unknown } | null;
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() || null : null;
  await prisma.emailService.update({ where: { id }, data: { apiKey } });
  invalidateEmailServiceCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "email.service.key.update",
    targetType: "email-service",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
