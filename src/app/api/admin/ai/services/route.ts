// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/ai/services — فهرست + ساخت سرویس AI (DECISION-039)
//   GET  : فهرست سرویس‌ها (بدون apiKey — فقط hasKey) — enforce ai.read
//   POST : ساخت سرویس جدید — enforce ai.manage
//
// apiKey هرگز در فهرست برنمی‌گردد. مشاهدهٔ مقدار خام فقط از مسیر /[id]/key (Owner).
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

interface ServiceInput {
  label: string;
  region: string;
  kind: string;
  providerType: string;
  baseURL: string | null;
  model: string;
  isActive: boolean;
  isDefault: boolean;
  apiKey?: string; // فقط هنگام ساخت/تغییر؛ خالی = بدون کلید/بدون تغییر
  note: string | null;
}

// اعتبارسنجی بدنهٔ ورودی (بدون apiKey که جداگانه هندل می‌شود)
function parseBody(body: unknown): { ok: true; data: ServiceInput } | { ok: false; error: string } {
  const b = body as Record<string, unknown>;
  const label = typeof b?.label === "string" ? b.label.trim() : "";
  if (!label) return { ok: false, error: "برچسب سرویس خالی است." };

  const region = String(b?.region ?? "");
  if (!REGIONS.includes(region)) return { ok: false, error: "منطقهٔ نامعتبر." };

  const kind = String(b?.kind ?? "");
  if (!KINDS.includes(kind)) return { ok: false, error: "نوع نامعتبر." };

  const providerType = String(b?.providerType ?? "openai-compatible");
  if (!PROVIDER_TYPES.includes(providerType)) return { ok: false, error: "نوع سرویس‌دهنده نامعتبر." };

  const model = typeof b?.model === "string" ? b.model.trim() : "";
  if (!model) return { ok: false, error: "نام مدل خالی است." };

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
      label, region, kind, providerType, baseURL, model,
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
  if (!can(ctx, "ai.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const services = await prisma.aiService.findMany({
    orderBy: [{ region: "asc" }, { kind: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    ok: true,
    services: services.map((s) => ({
      id: s.id,
      label: s.label,
      region: s.region,
      kind: s.kind,
      providerType: s.providerType,
      baseURL: s.baseURL,
      model: s.model,
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
  if (!can(ctx, "ai.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = parseBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    // اگر پیش‌فرض شد، پیش‌فرض‌های قبلی همین (منطقه, نوع) را بردار
    if (d.isDefault) {
      await tx.aiService.updateMany({
        where: { region: d.region, kind: d.kind, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.aiService.create({
      data: {
        label: d.label,
        region: d.region,
        kind: d.kind,
        providerType: d.providerType,
        baseURL: d.baseURL,
        apiKey: d.apiKey && d.apiKey.trim() ? d.apiKey.trim() : null,
        model: d.model,
        isActive: d.isActive,
        isDefault: d.isDefault,
        note: d.note,
        createdById: ctx.admin.id,
      },
    });
  });

  invalidateServiceCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "ai.service.create",
    targetType: "ai-service",
    targetId: created.id,
    meta: { label: d.label, region: d.region, kind: d.kind, isDefault: d.isDefault },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
