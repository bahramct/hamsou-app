// ─────────────────────────────────────────────────────────────────────────────
// audit-actions.ts — کاتالوگ منبع‌حقیقت کنش‌های لاگ ممیزی (DECISION-043)
//
// هر کنشی که از طریق logAdminAction ثبت می‌شود اینجا یک ردیف دارد:
//   - label: عنوان فارسی خوانا برای نمایش
//   - category: دستهٔ کنش (برای فیلتر و گروه‌بندی در viewer)
//   - tone: رنگ نشان (create=سبز، update=آبی، security=طلایی، danger=قرمز، auth=خنثی)
//
// قاعده: هر بار که در یک route کنش جدیدی لاگ می‌کنی، یک ردیف اینجا اضافه کن.
// کنش ناشناخته (در صورت جا افتادن) با describeAction به‌صورت امن fallback می‌شود
// (خود کلید نمایش داده می‌شود، نه crash).
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIT_CATEGORIES = {
  auth: "احراز هویت",
  admins: "ادمین‌ها",
  roles: "نقش‌ها و دسترسی‌ها",
  users: "کاربران",
  plans: "پلن‌ها و تخفیف",
  ai: "هوش مصنوعی",
  sms: "پیامک",
  payment: "پرداخت",
  support: "پشتیبانی",
} as const;

export type AuditCategory = keyof typeof AUDIT_CATEGORIES;

export type AuditTone = "create" | "update" | "security" | "danger" | "auth";

export interface AuditActionDef {
  label: string;
  category: AuditCategory;
  tone: AuditTone;
}

// کلیدها دقیقاً همان رشته‌هایی‌اند که در routeها به logAdminAction پاس می‌شوند.
export const AUDIT_ACTIONS: Record<string, AuditActionDef> = {
  // ── احراز هویت ──────────────────────────────────────────────────────────
  "admin.login":         { label: "ورود به پنل",                 category: "auth",   tone: "auth" },
  "admin.login.locked":  { label: "قفل حساب (تلاش ناموفق)",       category: "auth",   tone: "danger" },
  "admin.password.change": { label: "تغییر رمز عبور",             category: "auth",   tone: "security" },

  // ── ادمین‌ها ────────────────────────────────────────────────────────────
  "admin.create":             { label: "ساخت ادمین",              category: "admins", tone: "create" },
  "admin.role.change":        { label: "تغییر نقش ادمین",         category: "admins", tone: "security" },
  "admin.profile.update":     { label: "ویرایش پروفایل ادمین",    category: "admins", tone: "update" },
  "admin.activate":           { label: "فعال‌سازی ادمین",         category: "admins", tone: "create" },
  "admin.deactivate":         { label: "غیرفعال‌سازی ادمین",      category: "admins", tone: "danger" },
  "admin.delete":             { label: "حذف حساب ادمین",          category: "admins", tone: "danger" },
  "admin.password.reset":     { label: "بازنشانی رمز ادمین (مالک)", category: "admins", tone: "security" },
  "admin.ownership.transfer": { label: "انتقال مالکیت سایت",      category: "admins", tone: "security" },

  // ── نقش‌ها و دسترسی‌ها ──────────────────────────────────────────────────
  "role.create":         { label: "ساخت نقش",                    category: "roles",  tone: "create" },
  "role.permissions.set": { label: "تنظیم دسترسی‌های نقش",        category: "roles",  tone: "security" },
  "role.delete":         { label: "حذف نقش",                     category: "roles",  tone: "danger" },

  // ── کاربران ─────────────────────────────────────────────────────────────
  "user.plan.change":       { label: "تغییر پلن کاربر",             category: "users",  tone: "update" },
  "user.ban":               { label: "مسدودسازی کاربر",             category: "users",  tone: "danger" },
  "user.unban":             { label: "رفع مسدودی کاربر",            category: "users",  tone: "create" },
  "user.email.verify":      { label: "تأیید دستی ایمیل کاربر",      category: "users",  tone: "security" },
  "user.send.password_reset": { label: "ارسال لینک بازیابی رمز",    category: "users",  tone: "security" },

  // ── پلن‌ها و تخفیف ──────────────────────────────────────────────────────
  "plan.update":         { label: "ویرایش پلن",                  category: "plans",  tone: "update" },
  "discount.create":          { label: "ساخت کد تخفیف",               category: "plans",  tone: "create" },
  "discount.personal.create": { label: "کد تخفیف اختصاصی برای کاربر",  category: "plans",  tone: "create" },
  "discount.update":          { label: "ویرایش کد تخفیف",             category: "plans",  tone: "update" },
  "discount.delete":          { label: "حذف کد تخفیف",                category: "plans",  tone: "danger" },
  "notification.send":        { label: "ارسال اعلان به کاربر",          category: "users",  tone: "create" },
  "notification.broadcast":   { label: "اطلاعیه همگانی",               category: "users",  tone: "create" },

  // ── هوش مصنوعی ──────────────────────────────────────────────────────────
  "ai.service.create":   { label: "افزودن سرویس هوش مصنوعی",      category: "ai",     tone: "create" },
  "ai.service.update":   { label: "ویرایش سرویس هوش مصنوعی",      category: "ai",     tone: "update" },
  "ai.service.delete":   { label: "حذف سرویس هوش مصنوعی",         category: "ai",     tone: "danger" },
  "ai.service.key.reveal": { label: "مشاهدهٔ کلید API",          category: "ai",     tone: "security" },
  "ai.config.set":       { label: "تنظیم پیکربندی هوش مصنوعی",    category: "ai",     tone: "update" },
  "ai.binding.set":      { label: "اتصال بخش به مدل (Bind)",      category: "ai",     tone: "update" },
  "ai.prompt.save":      { label: "ذخیرهٔ پرامپت",               category: "ai",     tone: "update" },
  "ai.prompt.activate":  { label: "فعال‌سازی نسخهٔ پرامپت",       category: "ai",     tone: "update" },
  "ai.prompt.revert":    { label: "بازگردانی پرامپت",            category: "ai",     tone: "update" },

  // ── پیامک ───────────────────────────────────────────────────────────────
  "sms.service.create":    { label: "افزودن سرویس پیامک",          category: "sms",    tone: "create" },
  "sms.service.update":    { label: "ویرایش سرویس پیامک",          category: "sms",    tone: "update" },
  "sms.service.delete":    { label: "حذف سرویس پیامک",             category: "sms",    tone: "danger" },
  "sms.service.key.reveal": { label: "مشاهدهٔ کلید پیامک",         category: "sms",    tone: "security" },
  "sms.test.send":         { label: "ارسال پیامک تستی",            category: "sms",    tone: "update" },

  // ── پرداخت ──────────────────────────────────────────────────────────────
  "payment.card.create":   { label: "افزودن کارت مرجع",            category: "payment", tone: "create" },
  "payment.card.update":   { label: "ویرایش کارت مرجع",            category: "payment", tone: "update" },
  "payment.card.delete":   { label: "حذف کارت مرجع",               category: "payment", tone: "danger" },
  "wallet.topup.approve":  { label: "تأیید شارژ کیف‌پول",          category: "payment", tone: "create" },
  "wallet.topup.reject":   { label: "رد شارژ کیف‌پول",             category: "payment", tone: "danger" },
  "wallet.adjust":         { label: "اصلاح دستی موجودی",           category: "payment", tone: "security" },

  // ── پشتیبانی ────────────────────────────────────────────────────────────
  "support.reply":           { label: "پاسخ به تیکت",            category: "support", tone: "create" },
  "support.status.change":   { label: "تغییر وضعیت تیکت",         category: "support", tone: "update" },
  "support.priority.change": { label: "تغییر اولویت تیکت",        category: "support", tone: "update" },
  "livechat.settings.set":   { label: "تنظیمات چت آنلاین",         category: "support", tone: "update" },
};

/** فهرست کنش‌ها به‌تفکیک دسته — برای ساخت <optgroup> در فیلتر viewer. */
export function auditActionsByCategory(): { category: AuditCategory; label: string; actions: { key: string; label: string }[] }[] {
  return (Object.keys(AUDIT_CATEGORIES) as AuditCategory[]).map((cat) => ({
    category: cat,
    label: AUDIT_CATEGORIES[cat],
    actions: Object.entries(AUDIT_ACTIONS)
      .filter(([, def]) => def.category === cat)
      .map(([key, def]) => ({ key, label: def.label })),
  }));
}

/**
 * توصیف یک کنش با fallback امن. کنش ناشناخته (مثلاً قدیمی/جدید جا افتاده)
 * هرگز crash نمی‌کند — خودِ کلید به‌عنوان label و تونِ خنثی برمی‌گردد.
 */
export function describeAction(key: string): AuditActionDef {
  return AUDIT_ACTIONS[key] ?? { label: key, category: "auth", tone: "auth" };
}

/** آیا این رشته یک کلید کنشِ شناخته‌شده است؟ (اعتبارسنجی فیلتر) */
export function isAuditAction(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(AUDIT_ACTIONS, key);
}

/** آیا این رشته یک دستهٔ شناخته‌شده است؟ (اعتبارسنجی فیلتر) */
export function isAuditCategory(key: string): key is AuditCategory {
  return Object.prototype.hasOwnProperty.call(AUDIT_CATEGORIES, key);
}
