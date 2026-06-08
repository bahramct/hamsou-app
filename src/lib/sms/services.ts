// ─────────────────────────────────────────────────────────────────────────────
// sms/services.ts — resolver سرویس‌های پیامک (DECISION-061؛ آینهٔ ai/services.ts)
//
// مفهوم: هر «سرویس پیامک» یک ردیف SmsService است (provider + کلید/قالب/پارامتر).
// سرویسِ فعالِ پیش‌فرض برای کل سیستم استفاده می‌شود؛ نبود سرویس → fallback به env → mock.
//
// قاعدهٔ طلایی (مثل ai/services.ts): این لایه هرگز throw نمی‌کند. اگر DB در دسترس نبود،
// سرویسی پیدا نشد، یا پیکربندی ناقص بود → null برمی‌گرداند و send.ts به env/mock می‌افتد.
//
// cache کوتاه‌مدت (TTL) تا فشار DB روی هر ارسال کم شود ولی تغییرات پنل سریع اعمال شوند.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";

/** شکل سرویس مورد استفادهٔ runtime (شامل apiKey — فقط سمت سرور). */
export interface ResolvedSmsService {
  id: string;
  label: string;
  provider: string; // "smsir" | "mock"
  apiKey: string | null;
  templateId: number | null;
  paramName: string | null;
  baseURL: string | null;
  isSandbox: boolean;
  isActive: boolean;
  isDefault: boolean;
}

// ─── cache مشترک per-process ──────────────────────────────────────────────────
const CACHE_TTL_MS = 10_000;

interface CacheEntry<T> {
  value: T;
  at: number;
}

const globalForSms = globalThis as unknown as {
  __hamsoo_sms_default?: CacheEntry<ResolvedSmsService | null>;
  __hamsoo_sms_by_id?: Map<string, CacheEntry<ResolvedSmsService | null>>;
};
const byIdCache =
  globalForSms.__hamsoo_sms_by_id ?? (globalForSms.__hamsoo_sms_by_id = new Map());

/** کش‌ها را پاک می‌کند — هنگام هر تغییر سرویس از API صدا زده می‌شود. */
export function invalidateSmsServiceCache(): void {
  globalForSms.__hamsoo_sms_default = undefined;
  byIdCache.clear();
}

interface SmsServiceRow {
  id: string;
  label: string;
  provider: string;
  apiKey: string | null;
  templateId: number | null;
  paramName: string | null;
  baseURL: string | null;
  isSandbox: boolean;
  isActive: boolean;
  isDefault: boolean;
}

function rowToService(r: SmsServiceRow): ResolvedSmsService {
  return { ...r };
}

/** سرویسِ فعالِ پیش‌فرض را برمی‌گرداند (cache + fallback null).
 *  اگر هیچ ردیفِ isDefault نبود، تازه‌ترین سرویسِ فعال. */
export async function getDefaultSmsService(): Promise<ResolvedSmsService | null> {
  const now = Date.now();
  const cached = globalForSms.__hamsoo_sms_default;
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const row = await prisma.smsService.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    const value = row ? rowToService(row) : null;
    globalForSms.__hamsoo_sms_default = { value, at: now };
    return value;
  } catch {
    return null;
  }
}

/** یک سرویس را با id برمی‌گرداند (cache + fallback null). */
export async function getSmsServiceById(id: string): Promise<ResolvedSmsService | null> {
  const now = Date.now();
  const cached = byIdCache.get(id);
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const row = await prisma.smsService.findUnique({ where: { id } });
    const value = row ? rowToService(row) : null;
    byIdCache.set(id, { value, at: now });
    return value;
  } catch {
    return null;
  }
}
