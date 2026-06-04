// ─────────────────────────────────────────────────────────────────────────────
// support/availability.ts — وضعیت در دسترس‌بودن چت آنلاین (DECISION-049)
//
// یک منبع‌حقیقت واحد که سه محور را جمع می‌کند: روشن/خاموشِ کلی (AppSetting) +
// داخل ساعت کاری بودن (کاتالوگ) + حضور پشتیبان (presence). API و UI از همین می‌خوانند.
// ─────────────────────────────────────────────────────────────────────────────

import { getAppSetting, getAppSettingBool } from "@/lib/settings/app-settings";
import {
  SUPPORT_CHAT_KEYS,
  DEFAULT_WELCOME,
  parseWorkingHours,
  isWithinWorkingHours,
  renderSupportWelcome,
  type WorkingHours,
  type SupportChatAvailability,
} from "@/lib/support/chat";
import { isAnySupportAdminActive } from "@/lib/support/presence";

export type { SupportChatAvailability };

export interface SupportChatStatus {
  availability: SupportChatAvailability;
  enabled: boolean;
  withinHours: boolean;
  online: boolean;
  hours: WorkingHours;
}

/** وضعیت کاملِ در دسترس‌بودن «همین حالا». */
export async function getSupportChatStatus(now: Date): Promise<SupportChatStatus> {
  const enabled = await getAppSettingBool(SUPPORT_CHAT_KEYS.enabled, true);
  const hours = parseWorkingHours(await getAppSetting(SUPPORT_CHAT_KEYS.hours, ""));
  const withinHours = isWithinWorkingHours(now, hours);
  const online = enabled && withinHours ? await isAnySupportAdminActive(now) : false;

  let availability: SupportChatAvailability;
  if (!enabled) availability = "disabled";
  else if (!withinHours) availability = "offline_hours";
  else if (!online) availability = "offline_now";
  else availability = "online";

  return { availability, enabled, withinHours, online, hours };
}

/** متن خوش‌آمد رندرشده با نام کاربر (override پنل یا پیش‌فرض). */
export async function getSupportWelcome(name: string): Promise<string> {
  const template = await getAppSetting(SUPPORT_CHAT_KEYS.welcome, DEFAULT_WELCOME);
  return renderSupportWelcome(template, name);
}
