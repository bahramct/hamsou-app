// ─────────────────────────────────────────────────────────────────────────────
// /admin/settings — تنظیماتِ عمومیِ سایت (DECISION-088) — enforce: settings.read
// فعلاً: روشن/خاموشِ سفرِ onboarding. مقادیر از AppSetting خوانده می‌شوند.
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission, can } from "@/lib/admin/auth-server";
import { getAppSettingMany } from "@/lib/settings/app-settings";
import { SITE_SETTING_KEYS, SITE_SETTING_DEFAULTS } from "@/lib/settings/site";
import { SiteSettings } from "@/components/admin/settings/SiteSettings";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  const ctx = await requirePermission("settings.read");

  const raw = await getAppSettingMany([SITE_SETTING_KEYS.onboardingEnabled]);
  const stored = raw[SITE_SETTING_KEYS.onboardingEnabled];

  const initial = {
    onboardingEnabled:
      stored == null
        ? SITE_SETTING_DEFAULTS.onboardingEnabled
        : stored.toLowerCase() === "true",
  };

  return <SiteSettings initial={initial} canManage={can(ctx, "settings.manage")} />;
}
