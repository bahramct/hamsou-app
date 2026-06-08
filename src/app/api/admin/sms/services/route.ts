// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/sms/services — فهرست + ساخت سرویس پیامک (DECISION-061؛ آینهٔ ai/services)
//   GET  : فهرست سرویس‌ها (بدون apiKey — فقط hasKey) — enforce sms.read
//   POST : ساخت سرویس جدید — enforce sms.manage
//
// apiKey هرگز در فهرست برنمی‌گردد. مشاهدهٔ مقدار خام فقط از مسیر /[id]/key (Owner).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { invalidateSmsServiceCache } from "@/lib/sms/services";

const PROVIDERS = ["smsir", "mock"];

interface ServiceInput {
  label: string;
  provider: string;
  templateId: number | null;
  paramName: string | null;
  baseURL: string | null;
  isSandbox: boolean;
  isActive: boolean;
  isDefault: boolean;
  apiKey?: string;
  note: string | null;
}

function parseBody(body: unknown): { ok: true; data: ServiceInput } | { ok: false; error: string } {
  const b = body as Record<string, unknown>;
  const label = typeof b?.label === "string" ? b.label.trim() : "";
  if (!label) return { ok: false, error: "برچسب سرویس خالی است." };

  const provider = String(b?.provider ?? "smsir");
  if (!PROVIDERS.includes(provider)) return { ok: false, error: "نوع سرویس‌دهنده نامعتبر." };

  // templateId فقط برای smsir لازم است
  let templateId: number | null = null;
  if (provider === "smsir") {
    const raw = b?.templateId;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
    if (!n || Number.isNaN(n)) return { ok: false, error: "شناسهٔ قالب (templateId) برای sms.ir لازم است." };
    templateId = n;
  }

  const paramName = typeof b?.paramName === "string" && b.paramName.trim() ? b.paramName.trim() : "Code";

  let baseURL: string | null = null;
  const rawBase = typeof b?.baseURL === "string" ? b.baseURL.trim() : "";
  if (rawBase) {
    try { new URL(rawBase); baseURL = rawBase; }
    catch { return { ok: false, error: "آدرس (baseURL) معتبر نیست." }; }
  }

  const apiKey = typeof b?.apiKey === "string" ? b.apiKey : undefined;
  const note = typeof b?.note === "string" && b.note.trim() ? b.note.trim() : null;

  return {
    ok: true,
    data: {
      label,
      provider,
      templateId,
      paramName: provider === "smsir" ? paramName : null,
      baseURL,
      isSandbox: b?.isSandbox !== false,
      isActive: b?.isActive !== false,
      isDefault: b?.isDefault === true,
      apiKey,
      note,
    },
  };
}

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "sms.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const services = await prisma.smsService.findMany({
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    ok: true,
    services: services.map((s) => ({
      id: s.id,
      label: s.label,
      provider: s.provider,
      templateId: s.templateId,
      paramName: s.paramName,
      baseURL: s.baseURL,
      isSandbox: s.isSandbox,
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
  if (!can(ctx, "sms.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = parseBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    if (d.isDefault) {
      await tx.smsService.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return tx.smsService.create({
      data: {
        label: d.label,
        provider: d.provider,
        apiKey: d.apiKey && d.apiKey.trim() ? d.apiKey.trim() : null,
        templateId: d.templateId,
        paramName: d.paramName,
        baseURL: d.baseURL,
        isSandbox: d.isSandbox,
        isActive: d.isActive,
        isDefault: d.isDefault,
        note: d.note,
        createdById: ctx.admin.id,
      },
    });
  });

  invalidateSmsServiceCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "sms.service.create",
    targetType: "sms-service",
    targetId: created.id,
    meta: { label: d.label, provider: d.provider, isDefault: d.isDefault },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
