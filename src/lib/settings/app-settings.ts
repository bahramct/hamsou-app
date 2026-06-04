// ─────────────────────────────────────────────────────────────────────────────
// settings/app-settings.ts — resolver کلید-مقدار تنظیمات عمومی (DECISION-049)
//
// خواهرِ ai/config.ts ولی برای تنظیمات غیر-AI (ساعات کاری چت، متن خوش‌آمد، …).
// قاعدهٔ طلایی: همیشه یک fallback صریح بده — اگر DB در دسترس نبود یا کلید نبود،
// fallback برمی‌گردد و هیچ تنظیمی نباید جریان را بخواباند.
//
// cache کوتاه‌مدت (TTL) تا فشار DB کم شود ولی تغییر پنل سریع اعمال شود.
// set* کش را invalidate می‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";

const CACHE_TTL_MS = 10_000; // ۱۰ ثانیه

interface CacheEntry {
  value: string | null;
  at: number;
}

const globalForAppSettings = globalThis as unknown as {
  __hamsoo_app_settings_cache?: Map<string, CacheEntry>;
};
const cache: Map<string, CacheEntry> =
  globalForAppSettings.__hamsoo_app_settings_cache ?? new Map();
if (!globalForAppSettings.__hamsoo_app_settings_cache) {
  globalForAppSettings.__hamsoo_app_settings_cache = cache;
}

/** مقدار یک کلید را برمی‌گرداند؛ اگر نبود/خطا → fallback (همیشه الزامی). */
export async function getAppSetting(key: string, fallback: string): Promise<string> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.value ?? fallback;
  }
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    cache.set(key, { value: row?.value ?? null, at: now });
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

/** نسخهٔ boolean — "true" (هر حالت حروف) → true؛ بقیه → fallback اگر کلید نبود. */
export async function getAppSettingBool(key: string, fallback: boolean): Promise<boolean> {
  const raw = await getAppSetting(key, fallback ? "true" : "false");
  return raw.trim().toLowerCase() === "true";
}

/** چند کلید یک‌جا — برای صفحات admin (بدون cache، همیشه تازه). */
export async function getAppSettingMany(keys: string[]): Promise<Record<string, string>> {
  try {
    const rows = await prisma.appSetting.findMany({
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
export async function setAppSetting(
  key: string,
  value: string,
  updatedById?: string
): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value, updatedById: updatedById ?? null },
    create: { key, value, updatedById: updatedById ?? null },
  });
  cache.delete(key);
}
