// ─────────────────────────────────────────────────────────────────────────────
// ai/config.ts — resolver لایهٔ override کلید-مقدار AI (DECISION-037)
//
// قاعدهٔ طلایی: همیشه یک fallback صریح بده. اگر DB در دسترس نبود یا کلید نبود،
// fallback برمی‌گردد — هیچ override نباید AI را بخواباند.
//
// cache کوتاه‌مدت (TTL) تا فشار DB روی هر فراخوانی AI کم شود ولی تغییرات سریع
// اعمال شوند. setAiConfig کش را invalidate می‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";

const CACHE_TTL_MS = 10_000; // ۱۰ ثانیه

interface CacheEntry {
  value: string | null;
  at: number;
}

const globalForAiConfig = globalThis as unknown as {
  __hamsoo_ai_config_cache?: Map<string, CacheEntry>;
};
const cache: Map<string, CacheEntry> =
  globalForAiConfig.__hamsoo_ai_config_cache ?? new Map();
if (!globalForAiConfig.__hamsoo_ai_config_cache) {
  globalForAiConfig.__hamsoo_ai_config_cache = cache;
}

/**
 * مقدار یک کلید config را برمی‌گرداند؛ اگر نبود/خطا → fallback.
 * fallback همیشه الزامی است (محافظ ساختاری).
 */
export async function getAiConfig(key: string, fallback: string): Promise<string> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.value ?? fallback;
  }
  try {
    const row = await prisma.aiConfig.findUnique({ where: { key }, select: { value: true } });
    cache.set(key, { value: row?.value ?? null, at: now });
    return row?.value ?? fallback;
  } catch {
    // DB در دسترس نیست → fallback (هیچ‌گاه throw نمی‌کنیم)
    return fallback;
  }
}

/** نسخهٔ عددی با fallback عددی + اعتبارسنجی. */
export async function getAiConfigInt(key: string, fallback: number): Promise<number> {
  const raw = await getAiConfig(key, String(fallback));
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** نسخهٔ اعشاری (مثلاً temperature). */
export async function getAiConfigFloat(key: string, fallback: number): Promise<number> {
  const raw = await getAiConfig(key, String(fallback));
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** خواندن چند کلید به‌صورت یک‌جا — برای صفحات admin. بدون cache (همیشه تازه). */
export async function getAiConfigMany(keys: string[]): Promise<Record<string, string>> {
  try {
    const rows = await prisma.aiConfig.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    });
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  } catch {
    return {};
  }
}

/** ذخیرهٔ یک کلید (upsert) + invalidate کش. */
export async function setAiConfig(
  key: string,
  value: string,
  updatedById?: string
): Promise<void> {
  await prisma.aiConfig.upsert({
    where: { key },
    update: { value, updatedById: updatedById ?? null },
    create: { key, value, updatedById: updatedById ?? null },
  });
  cache.delete(key);
}
