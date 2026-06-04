// ─────────────────────────────────────────────────────────────────────────────
// support/tickets.ts — کاتالوگ منبع‌حقیقت دامنهٔ تیکتینگ (DECISION-044)
//
// چرا کد-محور؟ مثل permissions/plan-features: مقادیر category/priority/status باید
// در UI و enforce یکسان باشند و افزودنشان «یک ردیف» باشد. SQLite enum ندارد، پس در DB
// رشته ذخیره می‌شوند و اعتبارسنجی/برچسب/رنگ از همین‌جا می‌آید.
//
// توسعه‌پذیری: افزودن دستهٔ جدید = یک ردیف به TICKET_CATEGORIES. کانال جدید (مثل چت
// آنلاین آینده) = یک ردیف به TICKET_CHANNELS؛ مدل‌های DB از قبل فیلد channel دارند.
// ─────────────────────────────────────────────────────────────────────────────

export type Tone = "neutral" | "info" | "warn" | "danger" | "success";

interface CatalogItem {
  key: string;
  label: string;
  tone?: Tone;
}

// ─── دسته‌بندی موضوع تیکت ─────────────────────────────────────────────────────
export const TICKET_CATEGORIES: CatalogItem[] = [
  { key: "technical", label: "مشکل فنی" },
  { key: "billing", label: "پرداخت و اشتراک" },
  { key: "account", label: "حساب کاربری" },
  { key: "suggestion", label: "پیشنهاد و بازخورد" },
  { key: "other", label: "سایر" },
];

// ─── اولویت ───────────────────────────────────────────────────────────────────
// کاربر می‌تواند اولویت را هنگام ثبت تیکت مشخص کند (پیش‌فرض normal)؛ پشتیبان می‌تواند بعداً تغییر دهد.
export const TICKET_PRIORITIES: CatalogItem[] = [
  { key: "low", label: "کم", tone: "neutral" },
  { key: "normal", label: "عادی", tone: "info" },
  { key: "high", label: "زیاد", tone: "warn" },
  { key: "urgent", label: "فوری", tone: "danger" },
];

// ─── وضعیت گردش‌کار ───────────────────────────────────────────────────────────
export const TICKET_STATUSES: CatalogItem[] = [
  { key: "open", label: "باز", tone: "info" },
  { key: "in_progress", label: "در حال بررسی", tone: "warn" },
  { key: "answered", label: "پاسخ داده شد", tone: "success" },
  { key: "closed", label: "بسته", tone: "neutral" },
];

// ─── کانال (برای توسعهٔ آینده: چت آنلاین) ─────────────────────────────────────
export const TICKET_CHANNELS: CatalogItem[] = [
  { key: "ticket", label: "تیکت" },
  { key: "chat", label: "چت آنلاین" }, // آینده — مدل آماده است
];

// پیش‌فرض‌ها
export const DEFAULT_CATEGORY = "other";
export const DEFAULT_PRIORITY = "normal";
export const DEFAULT_STATUS = "open";
export const DEFAULT_CHANNEL = "ticket";

// محدودیت‌های ورودی (هم در UI و هم در API enforce می‌شوند)
export const TICKET_LIMITS = {
  subjectMin: 3,
  subjectMax: 120,
  messageMin: 1,
  messageMax: 4000,
} as const;

// ─── کلید امکانِ پلن که دسترسی تیکتینگ را گیت می‌کند (هم‌ترازی پنل↔پروژه) ──────
export const TICKETING_FEATURE_KEY = "support.ticketing";

// ─── helperها ─────────────────────────────────────────────────────────────────
function makeLookup(items: CatalogItem[]) {
  const map = new Map(items.map((i) => [i.key, i]));
  return {
    map,
    is: (k: string) => map.has(k),
    label: (k: string) => map.get(k)?.label ?? k,
    tone: (k: string): Tone => map.get(k)?.tone ?? "neutral",
  };
}

export const Categories = makeLookup(TICKET_CATEGORIES);
export const Priorities = makeLookup(TICKET_PRIORITIES);
export const Statuses = makeLookup(TICKET_STATUSES);
export const Channels = makeLookup(TICKET_CHANNELS);

/** وضعیت‌هایی که «باز/در جریان» محسوب می‌شوند (نه بسته) — برای شمارش و فیلتر. */
export const OPEN_STATUSES = ["open", "in_progress", "answered"] as const;
