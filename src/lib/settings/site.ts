// ─────────────────────────────────────────────────────────────────────────────
// settings/site.ts — کاتالوگِ تنظیماتِ عمومیِ سایت (DECISION-088)
//
// تنظیماتِ سراسریِ غیر-AI که از بخشِ «تنظیماتِ سایت» در پنل ادمین کنترل می‌شوند.
// مقادیر در AppSetting (key-value) ذخیره می‌شوند؛ resolver با cache+fallback در
// app-settings.ts. افزودنِ تنظیمِ جدید = یک کلید اینجا + یک ردیف در فرمِ پنل.
// ─────────────────────────────────────────────────────────────────────────────

import { getAppSettingBool } from "@/lib/settings/app-settings";

export const SITE_SETTING_KEYS = {
  /** نمایشِ سفرِ onboarding برای کاربرانِ تازه‌وارد (DECISION-085/088) */
  onboardingEnabled: "onboarding.enabled",
} as const;

export const SITE_SETTING_DEFAULTS = {
  onboardingEnabled: true,
} as const;

/**
 * آیا سفرِ onboarding فعال است؟ (پیش‌فرض: روشن)
 * هر جا که می‌خواهد کاربرِ تازه‌وارد را به /onboarding ببرد باید اول این را چک کند
 * تا خاموش‌کردن از پنل بلافاصله همه‌جا اعمال شود (هم‌ترازی سایت↔پنل).
 */
export async function isOnboardingEnabled(): Promise<boolean> {
  return getAppSettingBool(
    SITE_SETTING_KEYS.onboardingEnabled,
    SITE_SETTING_DEFAULTS.onboardingEnabled
  );
}
