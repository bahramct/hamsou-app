// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/ai/services/[id]/key — مشاهدهٔ مقدار خام کلید API (DECISION-039)
//   POST : فقط Owner — کلید واقعی این سرویس را برمی‌گرداند (برای نمایش با نگه‌داشتن دکمه).
//
// چرا POST و فقط-Owner؟ کلید حساس است؛ POST کش نمی‌شود و در URL/لاگ ظاهر نمی‌شود،
// و فقط مالک می‌تواند مقدار واقعی را ببیند (سایر ادمین‌ها فقط وضعیت تنظیم‌شده/نشده).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, isOwner } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!isOwner(ctx)) {
    return NextResponse.json({ error: "فقط مالک می‌تواند کلید را ببیند." }, { status: 403 });
  }

  const { id } = await params;
  const svc = await prisma.aiService.findUnique({
    where: { id },
    select: { apiKey: true, label: true },
  });
  if (!svc) return NextResponse.json({ error: "سرویس یافت نشد." }, { status: 404 });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "ai.service.key.reveal",
    targetType: "ai-service",
    targetId: id,
    meta: { label: svc.label },
  });

  return NextResponse.json(
    { ok: true, apiKey: svc.apiKey ?? "" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
