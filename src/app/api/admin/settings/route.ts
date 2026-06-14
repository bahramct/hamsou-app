// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/settings — تنظیماتِ عمومیِ سایت (DECISION-088)
//   GET  : مقادیر فعلی (enforce: settings.read)
//   POST : ذخیره (enforce: settings.manage)
// مقادیر در AppSetting ذخیره می‌شوند؛ تغییر بلافاصله (با invalidate cache) اعمال می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { getAppSettingMany, setAppSetting } from "@/lib/settings/app-settings";
import { SITE_SETTING_KEYS, SITE_SETTING_DEFAULTS } from "@/lib/settings/site";

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

  return NextResponse.json({
    ok: true,
    onboardingEnabled:
      stored == null
        ? SITE_SETTING_DEFAULTS.onboardingEnabled
        : stored.toLowerCase() === "true",
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

  const onboardingEnabled = body.onboardingEnabled === true || body.onboardingEnabled === "true";

  await setAppSetting(
    SITE_SETTING_KEYS.onboardingEnabled,
    onboardingEnabled ? "true" : "false",
    ctx.admin.id
  );

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "site.settings.set",
    targetType: "app-setting",
    meta: { onboardingEnabled },
  });

  return NextResponse.json({ ok: true });
}
