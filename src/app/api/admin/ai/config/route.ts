// POST /api/admin/ai/config — ذخیرهٔ تنظیمات کلید-مقدار AI (enforce: ai.manage)
// body: { updates: { key, value }[] }
// فقط کلیدهای مجاز (allowlist) پذیرفته می‌شوند تا نوشتن دلخواه ممکن نباشد.

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { setAiConfig } from "@/lib/ai/config";
import { AI_ROLES_ADMIN } from "@/lib/ai/admin-catalog";

// آیا کلید مجاز است؟ و آیا مقدارش معتبر است؟
// نکته: مدل/آدرس/کلید سرویس‌دهنده‌ها دیگر اینجا نیستند — در /api/admin/ai/services مدیریت می‌شوند (DECISION-039).
function validate(key: string, value: string): { ok: boolean; error?: string } {
  // role.<roleKey>.temperature → 0..2
  const tempMatch = key.match(/^role\.([a-z0-9-]+)\.temperature$/);
  if (tempMatch) {
    if (!AI_ROLES_ADMIN.some((r) => r.key === tempMatch[1])) return { ok: false, error: "نقش نامعتبر." };
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n < 0 || n > 2) return { ok: false, error: "temperature باید بین ۰ و ۲ باشد." };
    return { ok: true };
  }
  // role.<roleKey>.maxOutputTokens → integer مثبت
  const tokMatch = key.match(/^role\.([a-z0-9-]+)\.maxOutputTokens$/);
  if (tokMatch) {
    if (!AI_ROLES_ADMIN.some((r) => r.key === tokMatch[1])) return { ok: false, error: "نقش نامعتبر." };
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n <= 0) return { ok: false, error: "maxOutputTokens باید عدد مثبت باشد." };
    return { ok: true };
  }
  // chat.companion.defaultName → غیرخالی
  if (key === "chat.companion.defaultName") {
    return value.trim() ? { ok: true } : { ok: false, error: "نام همدم خالی است." };
  }
  // chat.welcome.template → غیرخالی
  if (key === "chat.welcome.template") {
    return value.trim() ? { ok: true } : { ok: false, error: "متن خوش‌آمد خالی است." };
  }
  return { ok: false, error: `کلید نامجاز: ${key}` };
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "ai.manage")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const updates: unknown = body?.updates;
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "هیچ تغییری ارسال نشد." }, { status: 400 });
  }

  // اعتبارسنجی همه قبل از نوشتن (atomic منطقی)
  const clean: { key: string; value: string }[] = [];
  for (const u of updates) {
    const key = typeof u?.key === "string" ? u.key.trim() : "";
    const value = typeof u?.value === "string" ? u.value : "";
    const v = validate(key, value);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    clean.push({ key, value });
  }

  for (const { key, value } of clean) {
    await setAiConfig(key, value, ctx.admin.id);
  }

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "ai.config.set",
    targetType: "ai-config",
    meta: { keys: clean.map((c) => c.key) },
  });

  return NextResponse.json({ ok: true, count: clean.length });
}
