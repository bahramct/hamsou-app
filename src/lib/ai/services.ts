// ─────────────────────────────────────────────────────────────────────────────
// ai/services.ts — resolver سرویس‌های AI و اتصال بخش‌ها (DECISION-039)
//
// مفهوم: هر «سرویس AI» یک ردیف AiService است (منطقه + نوع + مدل/آدرس/کلید).
// هر بخش سیستم (نقش) به سرویس Bind می‌شود؛ نبود Bind → سرویس پیش‌فرض همان (منطقه, نوع).
//
// قاعدهٔ طلایی (مثل ai/config.ts): این لایه هرگز throw نمی‌کند. اگر DB در دسترس نبود،
// سرویسی پیدا نشد، یا پیکربندی ناقص بود → null برمی‌گرداند و orchestrator به mock می‌افتد.
//
// cache کوتاه‌مدت (TTL) تا فشار DB روی هر فراخوانی AI کم شود ولی تغییرات پنل سریع اعمال شوند.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { getAiConfig } from "@/lib/ai/config";
import { AI_CONFIG_KEYS } from "@/lib/ai/admin-catalog";

export type AiRegion = "IR" | "INTL";
export type AiServiceKind = "text" | "image";

/** شکل سرویس مورد استفادهٔ runtime (شامل apiKey — فقط سمت سرور). */
export interface ResolvedAiService {
  id: string;
  label: string;
  region: string;
  kind: string;
  providerType: string;
  baseURL: string | null;
  apiKey: string | null;
  model: string;
  isActive: boolean;
  isDefault: boolean;
}

// ─── cache مشترک per-process ──────────────────────────────────────────────────
const CACHE_TTL_MS = 10_000;

interface CacheEntry<T> {
  value: T;
  at: number;
}

const globalForServices = globalThis as unknown as {
  __hamsoo_ai_service_by_id?: Map<string, CacheEntry<ResolvedAiService | null>>;
  __hamsoo_ai_default_service?: Map<string, CacheEntry<ResolvedAiService | null>>;
};
const byIdCache =
  globalForServices.__hamsoo_ai_service_by_id ??
  (globalForServices.__hamsoo_ai_service_by_id = new Map());
const defaultCache =
  globalForServices.__hamsoo_ai_default_service ??
  (globalForServices.__hamsoo_ai_default_service = new Map());

/** کش‌ها را پاک می‌کند — هنگام هر تغییر سرویس از API صدا زده می‌شود. */
export function invalidateServiceCache(): void {
  byIdCache.clear();
  defaultCache.clear();
}

function rowToService(r: {
  id: string;
  label: string;
  region: string;
  kind: string;
  providerType: string;
  baseURL: string | null;
  apiKey: string | null;
  model: string;
  isActive: boolean;
  isDefault: boolean;
}): ResolvedAiService {
  return { ...r };
}

/** یک سرویس را با id برمی‌گرداند (cache + fallback null). */
export async function getServiceById(id: string): Promise<ResolvedAiService | null> {
  const now = Date.now();
  const cached = byIdCache.get(id);
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const row = await prisma.aiService.findUnique({ where: { id } });
    const value = row ? rowToService(row) : null;
    byIdCache.set(id, { value, at: now });
    return value;
  } catch {
    return null;
  }
}

/** سرویس پیش‌فرضِ فعالِ یک (منطقه, نوع) را برمی‌گرداند (cache + fallback null). */
export async function getDefaultService(
  region: string,
  kind: string
): Promise<ResolvedAiService | null> {
  const cacheKey = `${region}|${kind}`;
  const now = Date.now();
  const cached = defaultCache.get(cacheKey);
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    // پیش‌فرضِ فعال؛ اگر چند ردیف isDefault بود (نباید بشود)، تازه‌ترین.
    const row = await prisma.aiService.findFirst({
      where: { region, kind, isActive: true, isDefault: true },
      orderBy: { updatedAt: "desc" },
    });
    const value = row ? rowToService(row) : null;
    defaultCache.set(cacheKey, { value, at: now });
    return value;
  } catch {
    return null;
  }
}

/**
 * پیش‌فرضِ سراسریِ یک نوع — صرف‌نظر از منطقه (DECISION-048).
 * وقتی منطقه‌ای سرویس مخصوص خودش ندارد، به این می‌افتیم: هر سرویسِ فعالِ همان نوع،
 * با اولویتِ آن‌هایی که isDefault هستند، سپس تازه‌ترین. (مدل تک-سرویسِ مالک.)
 */
export async function getGlobalDefaultService(kind: string): Promise<ResolvedAiService | null> {
  const cacheKey = `__global|${kind}`;
  const now = Date.now();
  const cached = defaultCache.get(cacheKey);
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const row = await prisma.aiService.findFirst({
      where: { kind, isActive: true },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    const value = row ? rowToService(row) : null;
    defaultCache.set(cacheKey, { value, at: now });
    return value;
  } catch {
    return null;
  }
}

/** country IP → منطقهٔ سرویس. ایران=IR؛ ناشناخته/سایر=INTL (مدل دو-سطلی owner). */
export function regionFromCountry(country: string | null | undefined): AiRegion {
  return country === "IR" ? "IR" : "INTL";
}

export interface ServiceResolution {
  service: ResolvedAiService | null;
  region: AiRegion;
  /** علت تصمیم برای observability/inspector */
  reason: string;
}

/**
 * تعیین سرویس برای یک نقش در یک منطقه و نوع.
 * ترتیب (DECISION-048): اتصال صریح → پیش‌فرض منطقه → پیش‌فرض سراسری → null (خطای واضح).
 * دیگر هیچ fallbackِ mock وجود ندارد؛ تنها سرویس‌های واقعی استفاده می‌شوند.
 */
export async function resolveServiceForRole(
  roleId: string,
  region: AiRegion,
  kind: AiServiceKind
): Promise<ServiceResolution> {
  // 1. اتصال صریح بخش → سرویس
  const boundId = await getAiConfig(AI_CONFIG_KEYS.binding(roleId, region), "");
  if (boundId) {
    const svc = await getServiceById(boundId);
    if (svc && svc.isActive && svc.kind === kind) {
      return { service: svc, region, reason: `bind ${roleId}/${region} → ${svc.label}` };
    }
    // اتصال نامعتبر/غیرفعال → ادامه به پیش‌فرض (محافظ ساختاری)
  }

  // 2. سرویس پیش‌فرض منطقه/نوع
  const def = await getDefaultService(region, kind);
  if (def) {
    return { service: def, region, reason: `default ${region}/${kind} → ${def.label}` };
  }

  // 3. پیش‌فرض سراسری (مدل تک-سرویس) — وقتی منطقه سرویس مخصوص ندارد
  const global = await getGlobalDefaultService(kind);
  if (global) {
    return { service: global, region, reason: `global ${kind} fallback (${region} نداشت) → ${global.label}` };
  }

  // 4. هیچ سرویسی پیکربندی نشده → خطای واضح در router
  return { service: null, region, reason: `هیچ سرویس ${kind} فعالی پیکربندی نشده` };
}
