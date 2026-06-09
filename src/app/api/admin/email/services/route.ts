// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/email/services — فهرست + ساخت سرویس ایمیل (DECISION-064؛ آینهٔ sms/services)
//   GET  : فهرست سرویس‌ها (بدون apiKey — فقط hasKey) — enforce email.read
//   POST : ساخت سرویس جدید — enforce email.manage
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { invalidateEmailServiceCache } from "@/lib/email/services";

const PROVIDERS = ["resend", "mock"];

interface ServiceInput {
  label: string;
  provider: string;
  apiKey?: string;
  fromAddress: string;
  fromName: string;
  isActive: boolean;
  isDefault: boolean;
  note: string | null;
}

function parseBody(body: unknown): { ok: true; data: ServiceInput } | { ok: false; error: string } {
  const b = body as Record<string, unknown>;
  const label = typeof b?.label === "string" ? b.label.trim() : "";
  if (!label) return { ok: false, error: "برچسب سرویس خالی است." };

  const provider = String(b?.provider ?? "resend");
  if (!PROVIDERS.includes(provider)) return { ok: false, error: "نوع سرویس‌دهنده نامعتبر." };

  const fromAddress =
    typeof b?.fromAddress === "string" && b.fromAddress.trim()
      ? b.fromAddress.trim()
      : "noreply@hamsoo.app";

  const fromName =
    typeof b?.fromName === "string" && b.fromName.trim() ? b.fromName.trim() : "همسو";

  const apiKey = typeof b?.apiKey === "string" ? b.apiKey : undefined;
  const note = typeof b?.note === "string" && b.note.trim() ? b.note.trim() : null;

  return {
    ok: true,
    data: {
      label,
      provider,
      apiKey,
      fromAddress,
      fromName,
      isActive: b?.isActive !== false,
      isDefault: b?.isDefault === true,
      note,
    },
  };
}

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "email.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const services = await prisma.emailService.findMany({
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    ok: true,
    services: services.map((s) => ({
      id: s.id,
      label: s.label,
      provider: s.provider,
      fromAddress: s.fromAddress,
      fromName: s.fromName,
      isActive: s.isActive,
      isDefault: s.isDefault,
      hasKey: Boolean(s.apiKey && s.apiKey.trim()),
      note: s.note,
    })),
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "email.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = parseBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    if (d.isDefault) {
      await tx.emailService.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return tx.emailService.create({
      data: {
        label: d.label,
        provider: d.provider,
        apiKey: d.apiKey && d.apiKey.trim() ? d.apiKey.trim() : null,
        fromAddress: d.fromAddress,
        fromName: d.fromName,
        isActive: d.isActive,
        isDefault: d.isDefault,
        note: d.note,
        createdById: ctx.admin.id,
      },
    });
  });

  invalidateEmailServiceCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "email.service.create",
    targetType: "email-service",
    targetId: created.id,
    meta: { label: d.label, provider: d.provider, isDefault: d.isDefault },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
