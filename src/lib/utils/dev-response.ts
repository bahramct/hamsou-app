// ─────────────────────────────────────────────────────────────────────────────
// dev-response.ts — helper برای افزودن payload فقط در حالت dev به پاسخ‌های API
//
// استفاده در API Route:
//   return NextResponse.json({
//     ok: true,
//     ...devOnlyPayload({ devCode: code }),
//   });
//
// - در حالت development: کلیدهای داخل `payload` در پاسخ هستند
// - در حالت production: خروجی این تابع `{}` خالی است (هیچ کلید dev نشت نمی‌کند)
//
// این لایه ۳ از معماری Dev/Prod است (CLAUDE.md §۱۳).
// لایه‌های دیگر: env.ts (منبع حقیقت)، DevOnly (محافظ UI)، DevModeBadge (نشانگر).
// ─────────────────────────────────────────────────────────────────────────────

import { IS_DEV_MODE } from "@/lib/env";

/**
 * فقط در dev mode payload را برمی‌گرداند. در prod همیشه `{}`.
 * با spread در JSON response استفاده کن.
 */
export function devOnlyPayload<T extends Record<string, unknown>>(
  payload: T
): T | Record<string, never> {
  return IS_DEV_MODE ? payload : {};
}
