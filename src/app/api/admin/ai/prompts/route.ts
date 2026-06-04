// POST /api/admin/ai/prompts — ذخیرهٔ نسخهٔ جدید override پرامپت یک نقش (enforce: ai.manage)
// body: { roleKey, locale, systemTemplate, userTemplate, note?, activate? }
// نسخهٔ افزایشی per (roleKey, locale)؛ اگر activate=true، این نسخه active و بقیه غیرفعال می‌شوند.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { getAiRoleAdminMeta, validatePromptTemplates } from "@/lib/ai/admin-catalog";

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "ai.manage")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const roleKey = typeof body?.roleKey === "string" ? body.roleKey.trim() : "";
  const locale = typeof body?.locale === "string" ? body.locale.trim() : "fa";
  const systemTemplate = typeof body?.systemTemplate === "string" ? body.systemTemplate : "";
  const userTemplate = typeof body?.userTemplate === "string" ? body.userTemplate : "";
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : null;
  const activate = body?.activate !== false; // پیش‌فرض: فعال‌سازی

  const meta = getAiRoleAdminMeta(roleKey);
  if (!meta) return NextResponse.json({ error: "نقش نامعتبر است." }, { status: 400 });
  if (!meta.locales.includes(locale)) {
    return NextResponse.json({ error: "locale نامعتبر است." }, { status: 400 });
  }
  if (!systemTemplate.trim() || !userTemplate.trim()) {
    return NextResponse.json({ error: "متن system و user الزامی است." }, { status: 400 });
  }

  // اعتبارسنجی placeholderها (محافظ بحرانی — جلوگیری از شکستن runtime)
  const check = validatePromptTemplates(roleKey, systemTemplate, userTemplate);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  // نسخهٔ بعدی
  const last = await prisma.aiPromptOverride.findFirst({
    where: { roleKey, locale },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (last?.version ?? 0) + 1;

  const created = await prisma.$transaction(async (tx) => {
    if (activate) {
      await tx.aiPromptOverride.updateMany({
        where: { roleKey, locale, isActive: true },
        data: { isActive: false },
      });
    }
    return tx.aiPromptOverride.create({
      data: {
        roleKey,
        locale,
        version: nextVersion,
        systemTemplate,
        userTemplate,
        isActive: activate,
        note,
        createdById: ctx.admin.id,
      },
      select: { id: true, version: true, isActive: true },
    });
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "ai.prompt.save",
    targetType: "ai-prompt",
    targetId: roleKey,
    meta: { locale, version: created.version, activate },
  });

  return NextResponse.json({ ok: true, ...created });
}
