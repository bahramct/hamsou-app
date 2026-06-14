// ─────────────────────────────────────────────────────────────────────────────
// /admin/settings — تنظیماتِ عمومیِ سایت (DECISION-088/089) — enforce: settings.read
// روشن/خاموشِ سفرِ onboarding + سازندهٔ کاملِ اسلایدها. مقادیر از AppSetting.
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission, can } from "@/lib/admin/auth-server";
import { getAppSettingMany } from "@/lib/settings/app-settings";
import { SITE_SETTING_KEYS, SITE_SETTING_DEFAULTS } from "@/lib/settings/site";
import { getOnboardingConfig } from "@/lib/onboarding/config";
import { SiteSettings } from "@/components/admin/settings/SiteSettings";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  const ctx = await requirePermission("settings.read");

  const [raw, onboarding] = await Promise.all([
    getAppSettingMany([SITE_SETTING_KEYS.onboardingEnabled]),
    getOnboardingConfig(),
  ]);
  const stored = raw[SITE_SETTING_KEYS.onboardingEnabled];

  const initial = {
    onboardingEnabled:
      stored == null ? SITE_SETTING_DEFAULTS.onboardingEnabled : stored.toLowerCase() === "true",
    onboarding,
  };

  return <SiteSettings initial={initial} canManage={can(ctx, "settings.manage")} />;
}
