// ─────────────────────────────────────────────────────────────────────────────
// reports/life-dimensions.ts — ابعاد ثابتِ زندگی برای رادار گزارش هفتگی
//
// رادار «نقشهٔ دسته‌ها» همیشه روی این ۶ محورِ ثابت رسم می‌شود — مستقل از اینکه
// هفته پر باشد یا خلوت (خواستهٔ مالک). این کلِ منطق سه‌حالتهٔ قبلی (رادار/میله/خالی)
// را حذف می‌کند و رادار را همیشه متقارن و قابل‌مقایسه بین هفته‌ها نگه می‌دارد.
//
// نگاشت: AI برای هر دسته یک `dimension` (یکی از ۶ کلید) می‌دهد؛ اگر نداد (گزارش
// قدیمی)، با کلیدواژهٔ روی برچسب حدس زده می‌شود و در نهایت fallback پایدار. این فایل
// «خالص» است (بدون Prisma/React) تا هم سرور و هم کلاینت از آن استفاده کنند.
// ─────────────────────────────────────────────────────────────────────────────

import type { WeeklyCategory } from "@/types/weekly-report";

export const DIMENSION_KEYS = [
  "work",
  "health",
  "relationships",
  "learning",
  "calm",
  "growth",
] as const;

export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export interface LifeDimension {
  key: DimensionKey;
  label: string; // برچسب کامل (توضیحی)
  short: string; // برچسب کوتاهِ محورِ رادار (تک‌مفهومی — جا می‌شود، کلیپ نمی‌شود)
  keywords: string[];
}

// ترتیب ثابت = ترتیب محورهای رادار (ساعتگرد از بالا).
export const LIFE_DIMENSIONS: LifeDimension[] = [
  { key: "work", label: "کار و مسئولیت", short: "کار", keywords: ["کار", "شغل", "پروژه", "وظیفه", "مسئولیت", "اداری", "جلسه", "مالی", "درآمد", "کسب"] },
  { key: "health", label: "سلامت و تن", short: "سلامت", keywords: ["ورزش", "تمرین", "پیاده", "دویدن", "بدن", "تغذیه", "غذا", "خواب", "سلامت", "آب", "رژیم"] },
  { key: "relationships", label: "روابط", short: "روابط", keywords: ["خانواده", "دوست", "همسر", "رابطه", "تماس", "دیدار", "والدین", "فرزند", "مادر", "پدر", "گفتگو"] },
  { key: "learning", label: "یادگیری", short: "یادگیری", keywords: ["مطالعه", "کتاب", "یادگیری", "آموزش", "مهارت", "زبان", "دوره", "درس", "تحقیق", "خواندن"] },
  { key: "calm", label: "آرامش و درون", short: "آرامش", keywords: ["مدیتیشن", "تمرکز", "آرامش", "استراحت", "معنوی", "دعا", "نماز", "ذهن", "تنفس", "سکوت", "طبیعت", "شکرگزاری"] },
  { key: "growth", label: "خلاقیت و رشد", short: "خلاقیت", keywords: ["نوشتن", "هنر", "خلاق", "موسیقی", "ایده", "هدف", "برنامه", "نقاشی", "ساخت", "مهارت شخصی", "عادت"] },
];

/** نگاشت کلید بُعد → برچسب کوتاهِ رادار (برای CategoryRadar). */
export const DIMENSION_SHORT: Record<DimensionKey, string> = Object.fromEntries(
  LIFE_DIMENSIONS.map((d) => [d.key, d.short])
) as Record<DimensionKey, string>;

const BY_KEY = new Map(LIFE_DIMENSIONS.map((d) => [d.key, d]));

function isDimensionKey(v: unknown): v is DimensionKey {
  return typeof v === "string" && BY_KEY.has(v as DimensionKey);
}

/** hash پایدار از یک رشته → 0..n-1 (برای توزیع دسته‌های بدون نگاشت). */
function stableIndex(s: string, n: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

/** بُعدِ یک دسته را تعیین می‌کند: dimension صریح → کلیدواژهٔ برچسب → fallback پایدار. */
function resolveDimension(label: string, explicit?: string | null): DimensionKey {
  if (isDimensionKey(explicit)) return explicit;
  const lower = label.trim();
  for (const d of LIFE_DIMENSIONS) {
    if (d.keywords.some((kw) => lower.includes(kw))) return d.key;
  }
  return DIMENSION_KEYS[stableIndex(lower || "x", DIMENSION_KEYS.length)];
}

/**
 * دسته‌های (پویا یا قدیمی) را به «همیشه ۶ بُعدِ ثابت» تجمیع می‌کند.
 * خروجی دقیقاً ۶ عضو به ترتیب LIFE_DIMENSIONS دارد (بُعدِ بدون فعالیت = صفر) تا
 * رادار همیشه فرم کامل و متقارن داشته باشد.
 */
export function mapToDimensions(categories: WeeklyCategory[]): WeeklyCategory[] {
  const acc = new Map<DimensionKey, { done: number; notDone: number; total: number }>();
  for (const d of LIFE_DIMENSIONS) acc.set(d.key, { done: 0, notDone: 0, total: 0 });

  for (const c of categories) {
    const key = resolveDimension(c.label, c.dimension);
    const slot = acc.get(key)!;
    slot.done += c.doneCount;
    slot.notDone += c.notDoneCount;
    slot.total += c.total;
  }

  return LIFE_DIMENSIONS.map((d) => {
    const slot = acc.get(d.key)!;
    return {
      label: d.label,
      dimension: d.key,
      doneCount: slot.done,
      notDoneCount: slot.notDone,
      total: slot.total,
    };
  });
}

/** آیا اصلاً فعالیتی برای نگاشت هست؟ (برای متن کمکیِ رادارِ خالی) */
export function hasAnyDimensionActivity(dims: WeeklyCategory[]): boolean {
  return dims.some((d) => d.total > 0);
}
