// ─────────────────────────────────────────────────────────────────────────────
// plans/access.ts — enforcement تک‌نقطهٔ امکانات/محدودیت پلن (DECISION-040)
//
// منبع‌حقیقت واحد: هر جای اپ که می‌خواهد بداند یک پلن چه امکانی دارد یا سقفش چند است،
// از همین‌جا می‌خواند — نه چک پراکندهٔ hardcode. سقف چت و گیت تأمل از این استفاده می‌کنند.
//
// قاعدهٔ طلایی (مثل ai/config): همیشه fallback به پیش‌فرضِ کاتالوگ. اگر DB در دسترس نبود
// یا ردیف نبود → پیش‌فرض. هیچ تغییر/خطای پنل نباید enforcement را بخواباند.
// cache کوتاه‌مدت تا فشار DB کم شود ولی تغییر پنل سریع اعمال شود.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import {
  isPlanKey,
  defaultBool,
  defaultComingSoon,
  defaultQuota,
  type PlanKey,
} from "@/lib/plans/features";

const CACHE_TTL_MS = 10_000;

interface FeatureRow {
  /** «مجاز» = نه غیرفعال و نه به‌زودی (مدل فلگ‌محور DECISION-042) */
  allowed: boolean;
  value: number | null;
}

const globalForPlanAccess = globalThis as unknown as {
  __hamsoo_plan_features?: Map<string, { value: Map<string, FeatureRow>; at: number }>;
};
const planCache =
  globalForPlanAccess.__hamsoo_plan_features ??
  (globalForPlanAccess.__hamsoo_plan_features = new Map());

/** کش امکاناتِ پلن را پاک می‌کند — هنگام هر تغییر پلن از پنل صدا زده می‌شود. */
export function invalidatePlanCache(): void {
  planCache.clear();
}

/** همهٔ ردیف‌های feature یک پلن را (cache‌شده) برمی‌گرداند. خطا → Map خالی (→ پیش‌فرض‌ها). */
async function loadPlanFeatures(plan: string): Promise<Map<string, FeatureRow>> {
  const now = Date.now();
  const cached = planCache.get(plan);
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const rows = await prisma.planFeatureValue.findMany({
      where: { planKey: plan },
      select: { featureKey: true, comingSoon: true, disabled: true, value: true },
    });
    const map = new Map<string, FeatureRow>();
    for (const r of rows) {
      // مجاز فقط وقتی نه غیرفعال است و نه به‌زودی. به‌محض روشن‌کردن از پنل (disabled=false)
      // دسترسی همین‌جا فعال می‌شود — هم‌ترازی پنل↔پروژه.
      map.set(r.featureKey, { allowed: !r.disabled && !r.comingSoon, value: r.value });
    }
    planCache.set(plan, { value: map, at: now });
    return map;
  } catch {
    return new Map();
  }
}

function normPlan(plan: string): PlanKey {
  return isPlanKey(plan) ? plan : "FREE";
}

/** آیا این پلن امکانِ boolean مشخصی را دارد؟ (DB → fallback پیش‌فرض کاتالوگ) */
export async function planAllows(plan: string, featureKey: string): Promise<boolean> {
  const p = normPlan(plan);
  const features = await loadPlanFeatures(p);
  const row = features.get(featureKey);
  if (row) return row.allowed;
  // fallback کاتالوگ: امکانِ پیش‌فرضِ پلن، مگر اینکه «به‌زودی» باشد.
  return defaultBool(featureKey, p) && !defaultComingSoon(featureKey);
}

/** سقف عددی (quota) این پلن برای یک امکان. (DB → fallback پیش‌فرض کاتالوگ) */
export async function planQuota(plan: string, featureKey: string): Promise<number> {
  const p = normPlan(plan);
  const features = await loadPlanFeatures(p);
  const row = features.get(featureKey);
  if (row && row.value !== null && Number.isFinite(row.value) && row.value >= 0) {
    return row.value;
  }
  return defaultQuota(featureKey, p);
}
