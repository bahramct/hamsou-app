// POST /api/admin/ai/prompts/activate — فعال‌سازی یک نسخه یا بازگشت به فایل (enforce: ai.manage)
// body: { roleKey, locale, version }  — اگر version=null → همهٔ override غیرفعال (بازگشت به فایل)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { getAiRoleAdminMeta } from "@/lib/ai/admin-catalog";

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "ai.manage")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const roleKey = typeof body?.roleKey === "string" ? body.roleKey.trim() : "";
  const locale = typeof body?.locale === "string" ? body.locale.trim() : "fa";
  const version: number | null =
    typeof body?.version === "number" ? body.version : null;

  if (!getAiRoleAdminMeta(roleKey)) {
    return NextResponse.json({ error: "نقش نامعتبر است." }, { status: 400 });
  }

  // بازگشت به فایل — همهٔ override غیرفعال
  if (version === null) {
    await prisma.aiPromptOverride.updateMany({
      where: { roleKey, locale, isActive: true },
      data: { isActive: false },
    });
    await logAdminAction({
      actorId: ctx.admin.id,
      action: "ai.prompt.revert",
      targetType: "ai-prompt",
      targetId: roleKey,
      meta: { locale },
    });
    return NextResponse.json({ ok: true, active: null });
  }

  const target = await prisma.aiPromptOverride.findUnique({
    where: { roleKey_locale_version: { roleKey, locale, version } },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "نسخه یافت نشد." }, { status: 404 });

  await prisma.$transaction([
    prisma.aiPromptOverride.updateMany({
      where: { roleKey, locale, isActive: true },
      data: { isActive: false },
    }),
    prisma.aiPromptOverride.update({ where: { id: target.id }, data: { isActive: true } }),
  ]);

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "ai.prompt.activate",
    targetType: "ai-prompt",
    targetId: roleKey,
    meta: { locale, version },
  });

  return NextResponse.json({ ok: true, active: version });
}
