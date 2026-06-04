// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/ai/services/[id] — ویرایش + حذف یک سرویس (DECISION-039)
//   PATCH  : ویرایش — enforce ai.manage. apiKey خالی = بدون تغییر کلید قبلی.
//   DELETE : حذف — enforce ai.manage. (اتصال‌های وابسته خودبه‌خود به پیش‌فرض می‌افتند.)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { invalidateServiceCache } from "@/lib/ai/services";

const REGIONS = ["IR", "INTL"];
const KINDS = ["text", "image"];
// DECISION-048: «mock» حذف شد — فقط سرویس‌های واقعی.
const PROVIDER_TYPES = ["openai-compatible"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "ai.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.aiService.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "سرویس یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });

  // فیلدهای اختیاری — فقط آن‌هایی که آمده‌اند تغییر می‌کنند
  const data: Record<string, unknown> = {};

  if (typeof b.label === "string") {
    if (!b.label.trim()) return NextResponse.json({ error: "برچسب خالی است." }, { status: 400 });
    data.label = b.label.trim();
  }
  const region = typeof b.region === "string" ? b.region : existing.region;
  const kind = typeof b.kind === "string" ? b.kind : existing.kind;
  if (typeof b.region === "string") {
    if (!REGIONS.includes(b.region)) return NextResponse.json({ error: "منطقهٔ نامعتبر." }, { status: 400 });
    data.region = b.region;
  }
  if (typeof b.kind === "string") {
    if (!KINDS.includes(b.kind)) return NextResponse.json({ error: "نوع نامعتبر." }, { status: 400 });
    data.kind = b.kind;
  }
  if (typeof b.providerType === "string") {
    if (!PROVIDER_TYPES.includes(b.providerType)) return NextResponse.json({ error: "نوع سرویس‌دهنده نامعتبر." }, { status: 400 });
    data.providerType = b.providerType;
  }
  if (typeof b.model === "string") {
    if (!b.model.trim()) return NextResponse.json({ error: "نام مدل خالی است." }, { status: 400 });
    data.model = b.model.trim();
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
  if (typeof b.isActive === "boolean") data.isActive = b.isActive;

  const willBeDefault = b.isDefault === true;

  const updated = await prisma.$transaction(async (tx) => {
    if (willBeDefault) {
      await tx.aiService.updateMany({
        where: { region, kind, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
      data.isDefault = true;
    } else if (b.isDefault === false) {
      data.isDefault = false;
    }
    return tx.aiService.update({ where: { id }, data });
  });

  invalidateServiceCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "ai.service.update",
    targetType: "ai-service",
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
  if (!can(ctx, "ai.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.aiService.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "سرویس یافت نشد." }, { status: 404 });

  await prisma.aiService.delete({ where: { id } });
  invalidateServiceCache();

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "ai.service.delete",
    targetType: "ai-service",
    targetId: id,
    meta: { label: existing.label },
  });

  return NextResponse.json({ ok: true });
}
