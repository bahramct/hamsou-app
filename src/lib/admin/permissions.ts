// ─────────────────────────────────────────────────────────────────────────────
// permissions.ts — کاتالوگ منبع‌حقیقت permissionهای ادمین (DECISION-036)
//
// این فایل تنها مرجع تعریف permission keyها، گروه‌ها و نقش‌های پایه است.
// seed (prisma/seed.ts) از همین فایل DB را پر می‌کند.
// UI و guardها از همین typeها استفاده می‌کنند.
//
// افزودن permission جدید: یک ردیف به ADMIN_PERMISSIONS اضافه کن، seed را دوباره اجرا کن.
// ─────────────────────────────────────────────────────────────────────────────

// ─── گروه‌های permission (برای دسته‌بندی در UI) ───────────────────────────────
export const PERMISSION_GROUPS = {
  dashboard: "داشبورد",
  users: "کاربران",
  plans: "پلن‌ها",
  ai: "هوش مصنوعی",
  sms: "پیامک",
  email: "ایمیل",
  payment: "پرداخت",
  support: "پشتیبانی",
  content: "محتوا",
  blog: "بلاگ",
  system: "سیستم",
} as const;

export type PermissionGroup = keyof typeof PERMISSION_GROUPS;

// ─── کاتالوگ permissionها ─────────────────────────────────────────────────────
interface PermissionDef {
  key: string;
  label: string;
  group: PermissionGroup;
}

export const ADMIN_PERMISSIONS = [
  { key: "dashboard.view", label: "مشاهده داشبورد", group: "dashboard" },

  { key: "users.read", label: "مشاهده کاربران", group: "users" },
  { key: "users.write", label: "ویرایش حساب کاربران (ایمیل، رمز)", group: "users" },
  { key: "users.plan.write", label: "تغییر پلن کاربر", group: "users" },
  { key: "users.ban", label: "مسدودسازی کاربر", group: "users" },

  { key: "plans.read", label: "مشاهده پلن‌ها", group: "plans" },
  { key: "plans.write", label: "ویرایش پلن‌ها", group: "plans" },

  { key: "ai.read", label: "مشاهده تنظیمات هوش مصنوعی", group: "ai" },
  { key: "ai.manage", label: "مدیریت مدل‌ها و پرامپت‌ها", group: "ai" },

  { key: "sms.read", label: "مشاهده پنل پیامک", group: "sms" },
  { key: "sms.send", label: "ارسال پیامک", group: "sms" },
  { key: "sms.manage", label: "مدیریت پنل پیامک", group: "sms" },

  { key: "email.read", label: "مشاهده پنل ایمیل", group: "email" },
  { key: "email.send", label: "ارسال ایمیل تستی", group: "email" },
  { key: "email.manage", label: "مدیریت سرویس‌های ایمیل", group: "email" },

  { key: "payment.read", label: "مشاهده پرداخت‌ها", group: "payment" },
  { key: "payment.manage", label: "مدیریت درگاه پرداخت", group: "payment" },

  { key: "support.read", label: "مشاهده تیکت‌ها", group: "support" },
  { key: "support.respond", label: "پاسخ به تیکت‌ها", group: "support" },
  { key: "support.chat", label: "مدیریت چت آنلاین", group: "support" },

  { key: "content.read", label: "مشاهده محتوا", group: "content" },
  { key: "content.write", label: "ویرایش محتوا و اعلان‌ها", group: "content" },

  { key: "blog.read", label: "مشاهده بلاگ", group: "blog" },
  { key: "blog.write", label: "نوشتن و ویرایش مقالات", group: "blog" },
  { key: "blog.moderate", label: "مدیریت کامنت‌ها", group: "blog" },

  { key: "admins.manage", label: "مدیریت ادمین‌ها", group: "system" },
  { key: "roles.manage", label: "مدیریت نقش‌ها و دسترسی‌ها", group: "system" },
  { key: "audit.read", label: "مشاهده لاگ ممیزی", group: "system" },
] as const satisfies readonly PermissionDef[];

export type PermissionKey = (typeof ADMIN_PERMISSIONS)[number]["key"];

/** همه permission keyها — برای نقش owner */
export const ALL_PERMISSION_KEYS: PermissionKey[] = ADMIN_PERMISSIONS.map(
  (p) => p.key
);

// ─── نقش‌های پایه (isSystem — غیرقابل حذف) ─────────────────────────────────────
export interface SystemRoleDef {
  key: string;
  label: string;
  description: string;
  /** permissionهای پیش‌فرض؛ "*" یعنی همه */
  permissions: PermissionKey[] | "*";
}

export const SYSTEM_ROLES: SystemRoleDef[] = [
  {
    key: "owner",
    label: "مالک سایت",
    description: "دسترسی کامل به همه بخش‌ها، از جمله مدیریت ادمین‌ها و نقش‌ها.",
    permissions: "*",
  },
  {
    key: "admin",
    label: "ادمین سیستم",
    description: "دسترسی به همه بخش‌ها به‌جز مدیریت ادمین‌ها و نقش‌ها.",
    permissions: ALL_PERMISSION_KEYS.filter(
      (k) => k !== "admins.manage" && k !== "roles.manage"
    ),
  },
  {
    key: "content",
    label: "تولیدکننده محتوا",
    description: "مدیریت محتوا، بلاگ و اعلان‌ها.",
    permissions: [
      "dashboard.view",
      "content.read",
      "content.write",
      "blog.read",
      "blog.write",
      "blog.moderate",
    ],
  },
  {
    key: "support",
    label: "پشتیبان",
    description: "پاسخ به تیکت‌ها و مشاهده کاربران (بدون تغییر پلن یا مسدودسازی).",
    permissions: ["dashboard.view", "support.read", "support.respond", "support.chat", "users.read"],
  },
];

/** permissionهای یک نقش پایه را به‌صورت آرایه برمی‌گرداند ("*" → همه) */
export function resolveRolePermissions(role: SystemRoleDef): PermissionKey[] {
  return role.permissions === "*" ? ALL_PERMISSION_KEYS : role.permissions;
}
