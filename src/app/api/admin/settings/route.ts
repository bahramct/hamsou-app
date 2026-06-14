// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/settings — تنظیماتِ عمومیِ سایت (DECISION-088/089)
//   GET  : مقادیر فعلی (enforce: settings.read) — toggle + پیکربندیِ اسلایدهای onboarding
//   POST : ذخیره (enforce: settings.manage) — onboardingEnabled و/یا onboarding(config)
// مقادیر در AppSetting ذخیره می‌شوند؛ تغییر بلافاصله (با invalidate cache) اعمال می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { getAppSettingMany, setAppSetting } from "@/lib/settings/app-settings";
import { SITE_SETTING_KEYS, SITE_SETTING_DEFAULTS } from "@/lib/settings/site";
import {
  ONBOARDING_CONFIG_KEY,
  onboardingConfigSchema,
  normalizeOnboardingConfig,
  getOnboardingConfig,
} from "@/lib/onboarding/config";

export const dynamic = "force-dynamic";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!can(ctx, "settings.read")) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const raw = await getAppSettingMany([SITE_SETTING_KEYS.onboardingEnabled]);
  const stored = raw[SITE_SETTING_KEYS.onboardingEnabled];
  const config = await getOnboardingConfig();

  return NextResponse.json({
    ok: true,
    onboardingEnabled:
      stored == null ? SITE_SETTING_DEFAULTS.onboardingEnabled : stored.toLowerCase() === "true",
    onboarding: config,
  });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!can(ctx, "settings.manage")) {
    return NextResponse.json({ ok: false, error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر" }, { status: 400 });
  }

  // toggleِ روشن/خاموش
  if ("onboardingEnabled" in body) {
    const enabled = body.onboardingEnabled === true || body.onboardingEnabled === "true";
    await setAppSetting(SITE_SETTING_KEYS.onboardingEnabled, enabled ? "true" : "false", ctx.admin.id);
  }

  // پیکربندیِ اسلایدها — اعتبارسنجی + نرمال‌سازی (دقیقاً یک final، final آخر، حداکثر یک name/motive)
  if ("onboarding" in body) {
    const parsed = onboardingConfigSchema.safeParse(body.onboarding);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "پیکربندیِ اسلایدها نامعتبر است." },
        { status: 400 }
      );
    }
    const normalized = normalizeOnboardingConfig(parsed.data);
    await setAppSetting(ONBOARDING_CONFIG_KEY, JSON.stringify(normalized), ctx.admin.id);
  }

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "site.settings.set",
    targetType: "app-setting",
    meta: {
      onboardingEnabled: "onboardingEnabled" in body ? body.onboardingEnabled : undefined,
      onboardingConfig: "onboarding" in body ? "updated" : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
