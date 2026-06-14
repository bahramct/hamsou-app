// ─────────────────────────────────────────────────────────────────────────────
// onboarding/config.ts — پیکربندیِ قابلِ مدیریتِ سفرِ onboarding (DECISION-089)
//
// «سازندهٔ کامل»: اسلایدها در AppSetting (کلید onboarding.config) به‌صورتِ JSON
// ذخیره می‌شوند — بدونِ migration. ادمین از /admin/settings آن‌ها را می‌سازد/ویرایش
// می‌کند. این ماژول منبعِ حقیقتِ شکلِ داده + پیش‌فرض + خواندن/نرمال‌سازیِ امن است.
//
// انواعِ اسلاید:
//   narrative — متنِ محض (افزودن/حذف/جابجاییِ نامحدود)
//   name      — ورودیِ نامِ کاربر (displayName) — کارکردی، حداکثر یکی، قابلِ خاموش‌کردن
//   motive    — پرسشِ انگیزه (onboardingMotive) — کارکردی، حداکثر یکی، قابلِ خاموش‌کردن
//   final     — دکمهٔ پایان (هدایت به اولین تعهد) — همیشه یکی، همیشه آخر، حذف‌ناپذیر
//
// placeholderِ {name} در متن‌ها → نامِ کاربر (با «، ») یا حذفِ نرم اگر نام نباشد.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import { getAppSetting } from "@/lib/settings/app-settings";
import { ONBOARDING_MOTIVES, MOTIVE_SLUGS } from "@/lib/onboarding/motives";

export const ONBOARDING_CONFIG_KEY = "onboarding.config";

export type SlideType = "narrative" | "name" | "motive" | "final";

export interface NarrativeSlide {
  id: string;
  type: "narrative";
  title: string;
  body: string;
  footnote: string;
  buttonText: string;
}
export interface NameSlide {
  id: string;
  type: "name";
  title: string;
  subtitle: string;
  placeholder: string;
  buttonText: string;
}
export interface MotiveOptionCfg {
  slug: string;
  label: string;
}
export interface MotiveSlide {
  id: string;
  type: "motive";
  title: string;
  subtitle: string;
  options: MotiveOptionCfg[];
  buttonText: string;
}
export interface FinalSlide {
  id: string;
  type: "final";
  title: string;
  body: string;
  footnote: string;
  buttonText: string;
}
export type OnboardingSlide = NarrativeSlide | NameSlide | MotiveSlide | FinalSlide;

export interface OnboardingConfig {
  slides: OnboardingSlide[];
}

// ─── Zod — اعتبارسنجیِ ساختار (برای save و read) ──────────────────────────────
const str = (max: number) => z.string().max(max);

// slugِ گزینه‌های انگیزه ثابت است (داده پایدار)؛ فقط label ویرایش‌پذیر است.
const motiveOptionSchema = z.object({
  slug: z.string().refine((s) => MOTIVE_SLUGS.includes(s), "slug انگیزه نامعتبر است"),
  label: str(40),
});

const narrativeSchema = z.object({
  id: str(40),
  type: z.literal("narrative"),
  title: str(120),
  body: str(600),
  footnote: str(200),
  buttonText: str(40),
});
const nameSchema = z.object({
  id: str(40),
  type: z.literal("name"),
  title: str(120),
  subtitle: str(300),
  placeholder: str(60),
  buttonText: str(40),
});
const motiveSchema = z.object({
  id: str(40),
  type: z.literal("motive"),
  title: str(120),
  subtitle: str(300),
  options: z.array(motiveOptionSchema).min(2).max(8),
  buttonText: str(40),
});
const finalSchema = z.object({
  id: str(40),
  type: z.literal("final"),
  title: str(120),
  body: str(600),
  footnote: str(200),
  buttonText: str(40),
});

export const onboardingSlideSchema = z.discriminatedUnion("type", [
  narrativeSchema,
  nameSchema,
  motiveSchema,
  finalSchema,
]);

export const onboardingConfigSchema = z.object({
  slides: z.array(onboardingSlideSchema).min(1).max(20),
});

// ─── پیش‌فرض (بدونِ اسلایدِ همدم — DECISION-089) ──────────────────────────────
export const DEFAULT_ONBOARDING_CONFIG: OnboardingConfig = {
  slides: [
    {
      id: "welcome",
      type: "narrative",
      title: "به همسو خوش آمدی",
      body: "هر روز، یک تعهدِ کوچک به خودت.\nفردا، یک بازخوردِ صادق.\nدر پایانِ هفته، نگاهی عمیق به مسیرت.",
      footnote: "بدون فشار. بدون قضاوت. فقط تو و مسیرت.",
      buttonText: "بزن بریم",
    },
    {
      id: "motive",
      type: "motive",
      title: "چه چیزی تو را به همسو آورد؟",
      subtitle: "هر چه باشد، اینجا جای توست. این فقط کمک می‌کند مسیرت کمی شخصی‌تر شروع شود.",
      options: ONBOARDING_MOTIVES.map((m) => ({ slug: m.slug, label: m.label })),
      buttonText: "ادامه",
    },
    {
      id: "name",
      type: "name",
      title: "تو را چه صدا کنیم؟",
      subtitle: "اسمی که دوست داری در همسو با آن خطابت کنیم.",
      placeholder: "مثلاً: بهرام",
      buttonText: "ادامه",
    },
    {
      id: "final",
      type: "final",
      title: "حالا، اولین قدم",
      body: "{name}آماده‌ای؟ یک تعهدِ کوچک و واقعی برای امروزت بنویس — همین‌جا مسیرت شروع می‌شود.",
      footnote: "",
      buttonText: "اولین تعهدم را بنویسم",
    },
  ],
};

/**
 * نرمال‌سازیِ امن: تضمین می‌کند حداکثر یک name/motive، دقیقاً یک final، و final آخر است.
 * ورودیِ نامعتبر یا تهی → پیش‌فرض.
 */
export function normalizeOnboardingConfig(input: unknown): OnboardingConfig {
  const parsed = onboardingConfigSchema.safeParse(input);
  if (!parsed.success) return DEFAULT_ONBOARDING_CONFIG;

  const slides = parsed.data.slides as OnboardingSlide[];

  // dedupe name/motive (اولی نگه داشته می‌شود)، جداکردنِ final
  const seen = { name: false, motive: false };
  const body: OnboardingSlide[] = [];
  const finals: FinalSlide[] = [];
  for (const s of slides) {
    if (s.type === "final") { finals.push(s); continue; }
    if (s.type === "name") { if (seen.name) continue; seen.name = true; }
    if (s.type === "motive") { if (seen.motive) continue; seen.motive = true; }
    body.push(s);
  }
  // دقیقاً یک final (آخری اگر چند تا بود؛ پیش‌فرض اگر هیچ)
  const final = finals[finals.length - 1] ?? DEFAULT_ONBOARDING_CONFIG.slides.find((s) => s.type === "final")!;

  const normalized = [...body, final];
  // اگر چیزی جز final نماند، حداقل پیش‌فرض را بده
  if (normalized.length === 1) return { slides: [DEFAULT_ONBOARDING_CONFIG.slides[0], final] };
  return { slides: normalized };
}

/** خواندنِ پیکربندیِ فعلی از AppSetting (با fallbackِ امن به پیش‌فرض). */
export async function getOnboardingConfig(): Promise<OnboardingConfig> {
  const raw = await getAppSetting(ONBOARDING_CONFIG_KEY, "");
  if (!raw) return DEFAULT_ONBOARDING_CONFIG;
  try {
    return normalizeOnboardingConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_ONBOARDING_CONFIG;
  }
}

/** برچسبِ یک slugِ انگیزه از پیکربندیِ فعلی (fallback به کاتالوگِ ثابت). */
export function motiveLabelFromConfig(config: OnboardingConfig, slug: string | null | undefined): string | null {
  if (!slug) return null;
  const motive = config.slides.find((s): s is MotiveSlide => s.type === "motive");
  const fromCfg = motive?.options.find((o) => o.slug === slug)?.label;
  if (fromCfg) return fromCfg;
  return ONBOARDING_MOTIVES.find((m) => m.slug === slug)?.label ?? null;
}
