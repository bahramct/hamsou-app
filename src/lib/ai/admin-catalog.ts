// ─────────────────────────────────────────────────────────────────────────────
// ai/admin-catalog.ts — منبع‌حقیقت متادیتای AI برای پنل ادمین (DECISION-037)
//
// شامل: فهرست نقش‌ها + placeholderهای مجاز هر نقش (برای اعتبارسنجی ویرایش پرامپت)،
// پیش‌فرض‌های همدم/سقف چت، و کاتالوگ کلیدهای config.
// ─────────────────────────────────────────────────────────────────────────────

export interface PromptVariable {
  name: string;
  desc: string;
}

export interface AiRoleAdminMeta {
  key: string;
  label: string;
  /** localeهای موجود این نقش (فعلاً فقط fa) */
  locales: string[];
  /** نوع سرویسی که این بخش نیاز دارد — مبنای اتصال (Bind) به سرویس درست (DECISION-039) */
  serviceKind: "text" | "image";
  /** placeholderهای مجاز در پرامپت این نقش — مبنای اعتبارسنجی */
  variables: PromptVariable[];
}

export const AI_ROLES_ADMIN: AiRoleAdminMeta[] = [
  {
    key: "weekly-report",
    label: "گزارش هفتگی",
    locales: ["fa"],
    serviceKind: "text",
    variables: [
      { name: "WEEK_START", desc: "شروع هفته (شمسی)" },
      { name: "WEEK_END", desc: "پایان هفته (شمسی)" },
      { name: "TOTAL_ENTRIES", desc: "تعداد تعهدهای هفته" },
      { name: "INCLUDE_COACHING", desc: "کوچینگ فعال؟ (true/false)" },
      { name: "INPUT_JSON", desc: "دادهٔ خام هفته (JSON)" },
    ],
  },
  {
    key: "weekly-reflection",
    label: "تأمل هفتگی (کوچ — Plus/Pro)",
    locales: ["fa"],
    serviceKind: "text",
    variables: [
      { name: "WEEK_START", desc: "شروع هفته (شمسی)" },
      { name: "WEEK_END", desc: "پایان هفته (شمسی)" },
      { name: "TOTAL_ENTRIES", desc: "تعداد تعهدهای هفته" },
      { name: "INPUT_JSON", desc: "دادهٔ خام هفته (JSON)" },
    ],
  },
  {
    key: "chat-companion",
    label: "همدم (چت)",
    locales: ["fa"],
    serviceKind: "text",
    variables: [
      { name: "COMPANION_NAME", desc: "نام همدم" },
      { name: "USER_DISPLAY_NAME", desc: "نام نمایشی کاربر" },
      { name: "TODAY_JALALI", desc: "تاریخ امروز (شمسی)" },
      { name: "CONTEXT_JSON", desc: "سابقهٔ ۳۰ روز اخیر (JSON)" },
      { name: "CONVERSATION_HISTORY", desc: "تاریخچهٔ مکالمه" },
      { name: "USER_MESSAGE", desc: "پیام فعلی کاربر" },
    ],
  },
  {
    key: "goal-companion",
    label: "همراه (کوچ هدف — Pro)",
    locales: ["fa"],
    serviceKind: "text",
    variables: [
      { name: "GOAL_TITLE", desc: "عنوان هدف" },
      { name: "START_JALALI", desc: "تاریخ شروع (شمسی)" },
      { name: "END_JALALI", desc: "تاریخ پایان (شمسی)" },
      { name: "DAY_NUMBER", desc: "روزِ چندمِ مسیر" },
      { name: "TOTAL_DAYS", desc: "کلِ روزهای مسیر" },
      { name: "STORIES_JSON", desc: "استوری‌های مسیر (JSON)" },
      { name: "COMMITMENTS_JSON", desc: "تعهدهای روزانهٔ اخیر (JSON)" },
      { name: "WEEKLY_SIGNAL", desc: "سیگنالِ گزارش هفتگیِ اخیر" },
      { name: "RECENT_CHAT", desc: "چند جملهٔ اخیرِ گفتگو با همدم" },
    ],
  },
];

/** مناطق سرویس‌دهی — مبنای دو-سطلی owner (ایران / غیرایران). */
export const AI_REGIONS: { key: "IR" | "INTL"; label: string }[] = [
  { key: "IR", label: "کاربران ایران" },
  { key: "INTL", label: "کاربران غیر ایران" },
];

/** انواع سرویس. */
export const AI_SERVICE_KINDS: { key: "text" | "image"; label: string }[] = [
  { key: "text", label: "متنی" },
  { key: "image", label: "تصویری" },
];

export function getAiRoleAdminMeta(key: string): AiRoleAdminMeta | undefined {
  return AI_ROLES_ADMIN.find((r) => r.key === key);
}

// ─── پیش‌فرض‌های همدم و سقف چت (fallback وقتی override نباشد) ──────────────────
export const DEFAULT_COMPANION_NAME = "همدم";

/** حداکثر تعداد کاراکتر پیام کاربر — پیش‌فرض ۵۰۰ */
export const DEFAULT_CHAT_MAX_MESSAGE_LENGTH = 500;

// {{NAME}} (نام همدم)، {{USER}} (نام کاربر) و {{LIMIT}} هنگام نمایش جایگزین می‌شوند.
// {{USER}} وقتی کاربر نام نگذاشته باشد به‌صورت آرام حذف می‌شود (renderWelcome).
export const DEFAULT_CHAT_WELCOME =
  "سلام {{USER}}! من {{NAME}} هستم — همراهت در همسو.\n" +
  "می‌تونیم روزانه تا {{LIMIT}} پیام داشته باشیم و مکالمه‌هامون تا یک ماه می‌مونند.\n" +
  "بگو، چه خبر؟";

// سقف پیام چت per-plan به «مدیریت پلن‌ها» منتقل شد (DECISION-040) — feature: chat.dailyLimit

// ─── کلیدهای config (برای جلوگیری از تایپوی پراکنده) ──────────────────────────
export const AI_CONFIG_KEYS = {
  /** اتصال یک بخش (نقش) به سرویس، per منطقه — مقدار = AiService.id (DECISION-039) */
  binding: (roleKey: string, region: string) => `bind.${roleKey}.${region}`,
  roleTemperature: (roleKey: string) => `role.${roleKey}.temperature`,
  roleMaxTokens: (roleKey: string) => `role.${roleKey}.maxOutputTokens`,
  companionDefaultName: "chat.companion.defaultName",
  chatWelcome: "chat.welcome.template",
  chatMaxMessageLength: "chat.companion.maxMessageLength",
} as const;

// ─── اعتبارسنجی placeholder پرامپت ────────────────────────────────────────────
const PLACEHOLDER_RE = /\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}/g;

export function extractPlaceholders(template: string): string[] {
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = PLACEHOLDER_RE.exec(template)) !== null) out.add(m[1]);
  return [...out];
}

/**
 * بررسی اینکه همهٔ placeholderهای پرامپت در فهرست مجاز نقش باشند.
 * placeholder ناشناخته → خطا (چون در runtime، substitute آن را throw می‌کند).
 */
export function validatePromptTemplates(
  roleKey: string,
  systemTemplate: string,
  userTemplate: string
): { ok: boolean; error?: string } {
  const meta = getAiRoleAdminMeta(roleKey);
  if (!meta) return { ok: false, error: "نقش نامعتبر است." };
  const allowed = new Set(meta.variables.map((v) => v.name));
  const used = [
    ...extractPlaceholders(systemTemplate),
    ...extractPlaceholders(userTemplate),
  ];
  const unknown = used.filter((u) => !allowed.has(u));
  if (unknown.length > 0) {
    return {
      ok: false,
      error: `placeholder ناشناخته: ${unknown.map((u) => `{{${u}}}`).join("، ")}. مجاز: ${[...allowed].join("، ")}`,
    };
  }
  return { ok: true };
}
