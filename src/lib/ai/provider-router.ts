// ─────────────────────────────────────────────────────────────────────────────
// Service Router — DECISION-039 + DECISION-048 (حذف کامل Mock)
//
// انتخاب سرویس AI (و آداپتر آن) بر اساس:
//   1. منطقهٔ کاربر از کشور IP (IR vs INTL) — locale تأثیری ندارد
//   2. نوع سرویس مورد نیاز نقش (text/image)
//   3. اتصال صریح بخش→سرویس، وگرنه پیش‌فرض منطقه، وگرنه پیش‌فرض سراسری
//
// DECISION-048: دیگر هیچ fallbackِ mock وجود ندارد. اگر سرویسی پیکربندی نشده باشد
// یا آداپتر ساخته نشود (مثلاً کلید خالی)، خطای واضح throw می‌شود — تا خرابیِ
// پیکربندی پنهان نماند و به‌جای پاسخِ جعلی، صریحاً دیده شود.
// قانون: فقط orchestrator این router را صدا می‌زند.
// ─────────────────────────────────────────────────────────────────────────────

import type { AIAdapter } from "@/lib/adapters/ai.adapter";
import type { AILocale } from "@/lib/ai/types";
import { getAIAdapterForService } from "@/lib/adapters";
import {
  resolveServiceForRole,
  regionFromCountry,
  type ResolvedAiService,
  type AiServiceKind,
} from "@/lib/ai/services";

export interface ProviderRouteRequest {
  userId: string;
  roleId: string;
  /** کد ISO-2 کشور IP کاربر (e.g., "IR"، "US")؛ null اگر تشخیص داده نشد */
  clientCountry: string | null;
  /** نوع سرویس مورد نیاز نقش (پیش‌فرض text) */
  kind?: AiServiceKind;
  /** locale فقط برای logging — تصمیم routing را تحت تأثیر قرار نمی‌دهد */
  locale: AILocale;
}

export interface ProviderRouteResult {
  adapter: AIAdapter;
  /** سرویس انتخاب‌شده (همیشه غیرnull؛ در نبود سرویس، تابع throw می‌کند) */
  service: ResolvedAiService;
  /** مدلی که باید استفاده شود (از سرویس) */
  model: string | undefined;
  resolvedCountry: string;
  reason: string;
}

/**
 * انتخاب سرویس + آداپتر برای یک نقش بر اساس country IP کاربر.
 * در نبودِ سرویس یا نقصِ پیکربندی (کلید خالی) → خطای واضح throw می‌شود (بدون mock).
 */
export async function getProviderForRequest(
  request: ProviderRouteRequest
): Promise<ProviderRouteResult> {
  const country = request.clientCountry;
  const region = regionFromCountry(country);
  const kind: AiServiceKind = request.kind ?? "text";

  const resolution = await resolveServiceForRole(request.roleId, region, kind);

  if (!resolution.service) {
    throw new Error(
      `[ProviderRouter] ${resolution.reason} — برای نقش «${request.roleId}» سرویسی پیدا نشد. در پنل ادمین یک سرویس ${kind} بساز و آن را پیش‌فرض کن.`
    );
  }

  // آداپتر سرویس را بساز — اگر کلید/پیکربندی ناقص بود، خطا propagate می‌شود (نه mockِ پنهان)
  const adapter = await getAIAdapterForService(resolution.service);
  return {
    adapter,
    service: resolution.service,
    model: resolution.service.model,
    resolvedCountry: country ?? "unknown",
    reason: `${resolution.reason} (locale=${request.locale})`,
  };
}
