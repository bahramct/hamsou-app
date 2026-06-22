// ─────────────────────────────────────────────────────────────────────────────
// /admin/settings/livechat — تنظیمات چت آنلاین (DECISION-049) — enforce: support.respond
// ساعات کاری + متن خوش‌آمد + روشن/خاموش کلی. مقادیر از AppSetting خوانده می‌شوند.
// منتقل از /admin/livechat/settings به تنظیمات سایت (DECISION-114)
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission } from "@/lib/admin/auth-server";
import { getAppSettingMany } from "@/lib/settings/app-settings";
import {
  SUPPORT_CHAT_KEYS,
  DEFAULT_WELCOME,
  parseWorkingHours,
} from "@/lib/support/chat";
import { LiveChatSettings } from "@/components/admin/livechat/LiveChatSettings";

export const dynamic = "force-dynamic";

export default async function LiveChatSettingsPage() {
  await requirePermission("support.respond");

  const raw = await getAppSettingMany([
    SUPPORT_CHAT_KEYS.enabled,
    SUPPORT_CHAT_KEYS.welcome,
    SUPPORT_CHAT_KEYS.hours,
  ]);

  const initial = {
    enabled: (raw[SUPPORT_CHAT_KEYS.enabled] ?? "true").toLowerCase() === "true",
    welcome: raw[SUPPORT_CHAT_KEYS.welcome] ?? DEFAULT_WELCOME,
    hours: parseWorkingHours(raw[SUPPORT_CHAT_KEYS.hours] ?? null),
  };

  return <LiveChatSettings initial={initial} />;
}
