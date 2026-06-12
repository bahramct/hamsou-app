// ─────────────────────────────────────────────────────────────────────────────
// plans/features.ts — کاتالوگ منبع‌حقیقت امکاناتِ پلن (DECISION-040)
//
// چرا در کد؟ هر امکانِ «قابل‌اعمال» به کدِ enforce نیاز دارد (مثل کاتالوگ permissions).
// پنل ادمین تعیین می‌کند هر پلن کدام امکان را دارد و با چه مقداری — اما خودِ فهرستِ
// امکاناتِ ممکن اینجاست. موارد «به‌زودی» (comingSoon) فعلاً enforce نمی‌شوند؛ فقط در
// جدول مقایسه نمایش داده می‌شوند تا قبل از ساختِ کامل، در پلن‌ها قابل‌علامت‌گذاری باشند.
//
// نوع امکان:
//   - "boolean": روشن/خاموش (مثل تب تأمل، تیکتینگ)
//   - "quota":   عددی (مثل سقف پیام چت روزانه)
//
// پیش‌فرض‌ها (defaults) = fallback وقتی ردیف DB نیست → رفتار امروز حفظ می‌شود.
// مقادیر FREE/PLUS/PRO اینجا باید با §۷ CLAUDE.md و صفحهٔ پلن‌ها هماهنگ بمانند.
// ─────────────────────────────────────────────────────────────────────────────

export const PLAN_KEYS = ["FREE", "PLUS", "PRO"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const PLAN_FEATURE_GROUPS = {
  chat: "همدم و چت",
  reports: "گزارش و تحلیل",
  support: "پشتیبانی",
  social: "اجتماعی",
} as const;

export type PlanFeatureGroup = keyof typeof PLAN_FEATURE_GROUPS;

export interface PlanFeatureDef {
  key: string;
  label: string;
  description?: string;
  group: PlanFeatureGroup;
  type: "boolean" | "quota";
  /** واحد نمایش برای quota (مثل «پیام در روز») */
  unit?: string;
  /** هنوز کدِ enforce ندارد — فقط نمایشی در مقایسه (تا فاز ساختش) */
  comingSoon?: boolean;
  /** پیش‌فرض هر پلن — fallback اگر ردیف DB نباشد (boolean→bool، quota→number) */
  defaults: Record<PlanKey, number | boolean>;
}

export const PLAN_FEATURES: PlanFeatureDef[] = [
  {
    key: "chat.dailyLimit",
    label: "سقف پیام روزانهٔ همدم",
    description: "بیشترین تعداد پیام کاربر در هر روز.",
    group: "chat",
    type: "quota",
    unit: "پیام در روز",
    defaults: { FREE: 10, PLUS: 20, PRO: 30 },
  },
  {
    key: "weekly.reflection",
    label: "تب «تأمل» در گزارش هفتگی",
    description: "تحلیل عمیق‌تر با نقش کوچ توسعهٔ فردی (نقش AI مستقل).",
    group: "reports",
    type: "boolean",
    defaults: { FREE: false, PLUS: true, PRO: true },
  },
  {
    key: "support.ticketing",
    label: "ارتباط تیکتینگ با پشتیبانی",
    description: "ارسال تیکت و پیگیری پاسخ.",
    group: "support",
    type: "boolean",
    // ساخته شد (DECISION-044) → دیگر «به‌زودی» نیست؛ برای پلاس و پرو فعال، با امکان روشن/خاموش‌کردن
    // برای هر پلن از پنل (به‌محض تغییر، enforcement همان‌جا دسترسی می‌دهد).
    defaults: { FREE: false, PLUS: true, PRO: true },
  },
  {
    key: "support.liveChat",
    label: "چت آنلاین پشتیبانی",
    description: "گفتگوی زندهٔ متنی با پشتیبان انسانی در ساعات کاری (DECISION-049).",
    group: "support",
    type: "boolean",
    // فقط پرو (خواستهٔ مالک). قابل روشن‌کردن برای هر پلن از پنل — به‌محض روشن‌شدن،
    // enforcement همین‌جا دسترسی می‌دهد (هم‌ترازی پنل↔پروژه).
    defaults: { FREE: false, PLUS: false, PRO: true },
  },
  {
    key: "social.network",
    label: "شبکهٔ اجتماعی همسو",
    description: "قابلیت‌های اجتماعی (به‌زودی).",
    group: "social",
    type: "boolean",
    comingSoon: true,
    defaults: { FREE: false, PLUS: false, PRO: true },
  },
];

const FEATURE_BY_KEY = new Map(PLAN_FEATURES.map((f) => [f.key, f]));

export function getPlanFeatureDef(key: string): PlanFeatureDef | undefined {
  return FEATURE_BY_KEY.get(key);
}

export const ALL_FEATURE_KEYS = PLAN_FEATURES.map((f) => f.key);

export function isPlanKey(value: string): value is PlanKey {
  return (PLAN_KEYS as readonly string[]).includes(value);
}

/** پیش‌فرض boolean یک امکان برای یک پلن (از کاتالوگ). */
export function defaultBool(featureKey: string, plan: PlanKey): boolean {
  const def = FEATURE_BY_KEY.get(featureKey);
  if (!def) return false;
  return Boolean(def.defaults[plan]);
}

/** آیا این امکان به‌صورت پیش‌فرض «به‌زودی» است؟ (هنوز enforce نمی‌شود) */
export function defaultComingSoon(featureKey: string): boolean {
  return Boolean(FEATURE_BY_KEY.get(featureKey)?.comingSoon);
}

/** پیش‌فرض quota یک امکان برای یک پلن (از کاتالوگ). */
export function defaultQuota(featureKey: string, plan: PlanKey): number {
  const def = FEATURE_BY_KEY.get(featureKey);
  if (!def) return 0;
  const v = def.defaults[plan];
  return typeof v === "number" ? v : 0;
}

// ─── متادیتای نمایشی پلن‌ها (fallback اگر ردیف Plan در DB نباشد) ───────────────
export interface PlanDisplayDefault {
  key: PlanKey;
  label: string;
  description: string;
  order: number;
  highlight: boolean;
  monthlyPrice: number;
  annualPrice: number;
}

// قیمت پلاس از مالک: ماهانه ۶۹٬۰۰۰، سالانه ۶۰۰٬۰۰۰. رایگان=۰. پرو فعلاً ۰ (در پنل تنظیم می‌شود).
export const PLAN_DEFAULTS: Record<PlanKey, PlanDisplayDefault> = {
  FREE: { key: "FREE", label: "رایگان", description: "شروع مسیر، بدون هزینه.", order: 0, highlight: false, monthlyPrice: 0, annualPrice: 0 },
  PLUS: { key: "PLUS", label: "پلاس", description: "تأمل عمیق‌تر و سقف بیشتر.", order: 1, highlight: true, monthlyPrice: 69000, annualPrice: 600000 },
  PRO: { key: "PRO", label: "پرو", description: "همهٔ امکانات همسو.", order: 2, highlight: false, monthlyPrice: 0, annualPrice: 0 },
};
