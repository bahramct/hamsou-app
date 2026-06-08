// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/sms/services/[id] — ویرایش + حذف یک سرویس پیامک (DECISION-061)
//   PATCH  : ویرایش — enforce sms.manage. apiKey خالی = بدون تغییر کلید قبلی.
//   DELETE : حذف — enforce sms.manage.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { invalidateSmsServiceCache } from "@/lib/sms/services";

const PROVIDERS = ["smsir", "mock"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "sms.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.smsService.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "سرویس یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });

  const data: Record<string, unknown> = {};

  if (typeof b.label === "string") {
    if (!b.label.trim()) return NextResponse.json({ error: "برچسب خالی است." }, { status: 400 });
    data.label = b.label.trim();
  }
  if (typeof b.provider === "string") {
    if (!PROVIDERS.includes(b.provider)) return NextResponse.json({ error: "نوع سرویس‌دهنده نامعتبر." }, { status: 400 });
    data.provider = b.provider;
  }
  const effectiveProvider = (data.provider as string) ?? existing.provider;

  if (b.templateId !== undefined) {
    const raw = b.templateId;
    if (raw === null || raw === "") {
      data.templateId = null;
    } else {
      const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
      if (!n || Number.isNaN(n)) return NextResponse.json({ error: "شناسهٔ قالب نامعتبر." }, { status: 400 });
      data.templateId = n;
    }
  }
  if (typeof b.paramName === "string") {
    data.paramName = b.paramName.trim() || null;
  }
  if (typeof b.baseURL === "string") {
    const raw = b.baseURL.trim();
    if (!raw) {
      data.baseURL = null;
    } else {
      try { new URL(raw); data.baseURL = raw; }
      catch { return NextResponse.json({ error: "آدرس (baseURL) معتبر نیست." }, { status: 400 }); }
    }
  }
  // apiKey: فقط اگر مقدار غیرخالی آمد جایگزین می‌شود (خالی = بدون تغییر)
  if (typeof b.apiKey === "string" && b.apiKey.trim()) {
    data.apiKey = b.apiKey.trim();
  }
  if (typeof b.note === "string") data.note = b.note.trim() || null;
  if (typeof b.isSandbox === "boolean") data.isSandbox = b.isSandbox;
  if (typeof b.isActive === "boolean") data.isActive = b.isActive;

  // اگر provider نهایی smsir است، باید templateId داشته باشد (موجود یا جدید)
  if (effectiveProvider === "smsir") {
    const finalTemplate = "templateId" in data ? data.templateId : existing.templateId;
    if (!finalTemplate) {
      return NextResponse.json({ error: "شناسهٔ قالب (templateId) برای sms.ir لازم است." }, { status: 400 });
    }
  }

  const willBeDefault = b.isDefault === true;

  const updated = await prisma.$transaction(async (tx) => {
    if (willBeDefault) {
      await tx.smsService.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
      data.isDefault = true;
    } else if (b.isDefault === false) {
      data.isDefault = false;
    }
    return tx.smsService.update({ where: { id }, data });
  });

  invalidateSmsServiceCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "sms.service.update",
    targetType: "sms-service",
    targetId: id,
    meta: { keys: Object.keys(data), keyChanged: "apiKey" in data },
  });

  return NextResponse.json({ ok: true, id: updated.id });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "sms.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.smsService.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "سرویس یافت نشد." }, { status: 404 });

  await prisma.smsService.delete({ where: { id } });
  invalidateSmsServiceCache();

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "sms.service.delete",
    targetType: "sms-service",
    targetId: id,
    meta: { label: existing.label },
  });

  return NextResponse.json({ ok: true });
}
