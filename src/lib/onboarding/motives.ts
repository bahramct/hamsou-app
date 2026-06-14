// ─────────────────────────────────────────────────────────────────────────────
// onboarding/motives.ts — گزینه‌های پرسشِ شخصی‌سازِ onboarding (DECISION-088)
//
// «چه چیزی تو را به همسو آورد؟» — یک پرسشِ راهبردی (الگوی Notion) که انگیزهٔ
// کاربر را ثبت می‌کند تا تجربهٔ اول کمی شخصی‌تر شود (لحنِ پردهٔ پایانی + زمینهٔ AI).
// مقدارِ ذخیره‌شده = slug پایدار (نه متنِ فارسی) تا در برابرِ تغییرِ متن مقاوم بماند.
//
// خطِ قرمزِ مانیفست: این یک «فرمِ اجباری» نیست — کاملاً اختیاری و قابلِ رد.
// ─────────────────────────────────────────────────────────────────────────────

export interface MotiveOption {
  slug: string;
  label: string;
}

export const ONBOARDING_MOTIVES: readonly MotiveOption[] = [
  { slug: "daily-rhythm", label: "نظمِ روزانه" },
  { slug: "calm", label: "آرامش و تعادل" },
  { slug: "self-awareness", label: "خودشناسی" },
  { slug: "specific-change", label: "تغییری مشخص" },
] as const;

export const MOTIVE_SLUGS = ONBOARDING_MOTIVES.map((m) => m.slug);

/** آیا این slug یکی از گزینه‌های معتبر است؟ (اعتبارسنجیِ سرور) */
export function isValidMotive(slug: string): boolean {
  return MOTIVE_SLUGS.includes(slug);
}

/** برچسبِ فارسیِ یک slug — برای نمایش (پنل/پایانِ سفر). ناشناخته → null. */
export function motiveLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return ONBOARDING_MOTIVES.find((m) => m.slug === slug)?.label ?? null;
}
