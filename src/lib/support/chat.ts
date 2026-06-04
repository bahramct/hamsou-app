// ─────────────────────────────────────────────────────────────────────────────
// support/chat.ts — کاتالوگ منبع‌حقیقت دامنهٔ چت آنلاین پشتیبانی (DECISION-049)
//
// مثل tickets.ts / notifications/catalog.ts: ثابت‌ها، کلیدها و helperهای «خالص»
// (بدون وابستگی به DB یا React) اینجا متمرکزند تا UI و سرور یکسان رفتار کنند.
//
// زمان: ایران UTC+3:30 و از ۲۰۲۲ ساعت تابستانی ندارد → offset ثابت. همهٔ توابع یک
// `now: Date` می‌گیرند (caller باید getNow() بدهد) تا time-travel dev خودکار کار کند.
// ─────────────────────────────────────────────────────────────────────────────

// ─── گیت پلن (هم‌ترازی پنل↔پروژه) ─────────────────────────────────────────────
export const LIVE_CHAT_FEATURE_KEY = "support.liveChat";

// ─── شکل داده‌های منتقل‌شده (client-safe — بدون Prisma) ───────────────────────
export interface ChatMessageDTO {
  id: string;
  authorType: "user" | "admin";
  body: string;
  createdAt: string; // ISO
}

export interface ChatSessionDTO {
  dayKey: string;
  label: string; // برچسب جلالی روز
  isToday: boolean;
  messages: ChatMessageDTO[];
}

// وضعیت در دسترس‌بودن (آینهٔ availability.ts برای مصرف client)
export type SupportChatAvailability =
  | "online"
  | "offline_now"
  | "offline_hours"
  | "disabled";

// ─── کلیدهای AppSetting (تنظیمات قابل‌ویرایش از پنل) ──────────────────────────
export const SUPPORT_CHAT_KEYS = {
  enabled: "support.chat.enabled", // "true" | "false" — روشن/خاموش کلی
  welcome: "support.chat.welcome", // template با {{NAME}}
  hours: "support.chat.hours", // JSON: WorkingHours
} as const;

// ─── متن خوش‌آمد پیش‌فرض (قابل‌تغییر از پنل) ───────────────────────────────────
// {{NAME}} با نام نمایشی کاربر جایگزین می‌شود (مثل renderWelcome همدم).
export const DEFAULT_WELCOME =
  "{{NAME}} عزیز، به بخش پشتیبانی آنلاین همسو خوش آمدید. لطفاً پیام خود را بگذارید؛ همکاران ما کمتر از ۵ دقیقه پاسخگوی شما خواهند بود.";

// ─── محدودیت‌های ورودی (هم در UI و هم در API enforce می‌شوند) ──────────────────
export const SUPPORT_CHAT_LIMITS = {
  messageMin: 1,
  messageMax: 2000,
} as const;

// ─── پنجرهٔ presence: پشتیبان «آنلاین» اگر lastSeenAt جدیدتر از این باشد ────────
export const PRESENCE_WINDOW_MS = 60_000; // ۶۰ ثانیه

// ─── ساعات کاری ───────────────────────────────────────────────────────────────
// days = مقادیر JS getDay به وقت ایران (یکشنبه=۰ … شنبه=۶). from/to = "HH:MM".
export interface WorkingHours {
  days: number[];
  from: string; // "09:00"
  to: string; // "17:00"
}

// پیش‌فرض: شنبه تا پنجشنبه، ۹ تا ۱۷ (جمعه=۵ تعطیل). شنبه=۶، یکشنبه=۰ … پنجشنبه=۴.
export const DEFAULT_WORKING_HOURS: WorkingHours = {
  days: [6, 0, 1, 2, 3, 4],
  from: "09:00",
  to: "17:00",
};

// ترتیب نمایشی هفته به‌سبک فارسی (شنبه ابتدا، جمعه انتها) — برای UI تنظیمات.
export const WEEK_DAYS: { dow: number; label: string }[] = [
  { dow: 6, label: "شنبه" },
  { dow: 0, label: "یکشنبه" },
  { dow: 1, label: "دوشنبه" },
  { dow: 2, label: "سه‌شنبه" },
  { dow: 3, label: "چهارشنبه" },
  { dow: 4, label: "پنجشنبه" },
  { dow: 5, label: "جمعه" },
];

// ─── زمانِ ایران ──────────────────────────────────────────────────────────────
const IRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;

interface IranParts {
  dow: number; // روز هفته (JS getDay): یکشنبه=۰ … شنبه=۶
  minutesOfDay: number; // دقیقهٔ سپری‌شده از نیمه‌شب ایران
  dayKey: string; // "YYYY-MM-DD" به وقت ایران
}

/** اجزای زمانِ محلی ایران را از یک لحظهٔ مطلق بیرون می‌کشد. */
export function iranParts(now: Date): IranParts {
  // با شیفت‌دادن timestamp و استفاده از getterهای UTC، ساعتِ دیواریِ ایران به‌دست می‌آید.
  const shifted = new Date(now.getTime() + IRAN_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  const dayKey = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return {
    dow: shifted.getUTCDay(),
    minutesOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    dayKey,
  };
}

/** کلید روزِ ایران (مرز سشن روزانه). */
export function dayKeyForIran(now: Date): string {
  return iranParts(now).dayKey;
}

/** "HH:MM" → دقیقهٔ روز. نامعتبر → null. */
function parseHM(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** JSON ذخیره‌شده → WorkingHours معتبر؛ هر خطا → پیش‌فرض (محافظ ساختاری). */
export function parseWorkingHours(json: string | null | undefined): WorkingHours {
  if (!json) return DEFAULT_WORKING_HOURS;
  try {
    const raw = JSON.parse(json) as Partial<WorkingHours>;
    const days = Array.isArray(raw.days)
      ? raw.days.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
      : null;
    const fromOk = typeof raw.from === "string" && parseHM(raw.from) !== null;
    const toOk = typeof raw.to === "string" && parseHM(raw.to) !== null;
    if (!days || days.length === 0 || !fromOk || !toOk) return DEFAULT_WORKING_HOURS;
    return { days, from: raw.from as string, to: raw.to as string };
  } catch {
    return DEFAULT_WORKING_HOURS;
  }
}

/** آیا «الان» داخل ساعات کاری است؟ (روزِ هفته + بازهٔ ساعت، به وقت ایران) */
export function isWithinWorkingHours(now: Date, hours: WorkingHours): boolean {
  const { dow, minutesOfDay } = iranParts(now);
  if (!hours.days.includes(dow)) return false;
  const from = parseHM(hours.from);
  const to = parseHM(hours.to);
  if (from === null || to === null) return false;
  return minutesOfDay >= from && minutesOfDay < to;
}

/** خلاصهٔ خوانای روزها برای نمایش (مثل «شنبه تا پنجشنبه» یا فهرست). */
export function formatWorkingDays(days: number[]): string {
  const set = new Set(days);
  const ordered = WEEK_DAYS.filter((w) => set.has(w.dow));
  if (ordered.length === 0) return "—";
  // بازهٔ پیوسته در ترتیب فارسی → «X تا Y»
  const idxs = ordered.map((o) => WEEK_DAYS.findIndex((w) => w.dow === o.dow));
  const contiguous = idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1);
  if (contiguous && ordered.length > 2) {
    return `${ordered[0].label} تا ${ordered[ordered.length - 1].label}`;
  }
  return ordered.map((o) => o.label).join("، ");
}

/** رندر متن خوش‌آمد با نام کاربر. */
export function renderSupportWelcome(template: string, name: string): string {
  return template.replace(/\{\{\s*NAME\s*\}\}/g, name);
}
