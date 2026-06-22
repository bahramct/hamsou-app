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

/** آیا این slug (یا رشتهٔ چندتایی جداشده با کاما) معتبر است؟ (اعتبارسنجیِ سرور) */
export function isValidMotive(raw: string): boolean {
  if (!raw) return false;
  return raw.split(",").every((s) => MOTIVE_SLUGS.includes(s.trim()));
}

/** برچسبِ فارسیِ یک slug یا چند slug جداشده با کاما — برای نمایش. ناشناخته → null. */
export function motiveLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const labels = slug
    .split(",")
    .map((s) => ONBOARDING_MOTIVES.find((m) => m.slug === s.trim())?.label)
    .filter(Boolean) as string[];
  return labels.length ? labels.join("، ") : null;
}

/** تبدیلِ رشتهٔ ذخیره‌شده به آرایه (backward-compatible) */
export function motiveToSlugs(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter((s) => MOTIVE_SLUGS.includes(s));
}

/** تبدیلِ آرایه به رشتهٔ ذخیره‌شده */
export function slugsToMotive(slugs: string[]): string {
  return slugs.join(",");
}
