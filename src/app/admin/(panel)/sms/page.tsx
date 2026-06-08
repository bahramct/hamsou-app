// ─────────────────────────────────────────────────────────────────────────────
// /admin/sms — مدیریت پیامک (DECISION-061)
//   - سرویس‌های پیامک: CRUD (provider/کلید/قالب/پارامتر) — منبع‌حقیقت ارسال
//   - بنر «سرویس فعال»: نشان می‌دهد ارسال از کدام مسیر می‌رود (sms.ir/Mock، sandbox؟)
//   - ارسال تستی + تاریخچهٔ ارسال: اطمینان از عبور ورودِ سایت از مسیر درست
// enforce: sms.read؛ تغییر: sms.manage؛ ارسال تست: sms.send؛ مشاهدهٔ کلید: فقط Owner
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission, can, isOwner } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { getActiveSmsServiceInfo } from "@/lib/sms/send";
import { SmsServicesManager, type SmsServiceView } from "@/components/admin/sms/SmsServicesManager";
import { SmsActivityPanel } from "@/components/admin/sms/SmsActivityPanel";
import type { SmsLogView } from "@/components/admin/sms/SmsDeliveryLog";

export const dynamic = "force-dynamic";

const PURPOSE_LABELS: Record<string, string> = {
  "otp-login": "ورود به سایت",
  "otp-add-phone": "افزودن موبایل",
  test: "ارسال تستی",
};

export default async function SmsPage() {
  const ctx = await requirePermission("sms.read");
  const canManage = can(ctx, "sms.manage");
  const canSend = can(ctx, "sms.send");
  const owner = isOwner(ctx);

  // ── سرویس‌ها (بدون apiKey — فقط hasKey) ───────────────────────────────────
  const rows = await prisma.smsService.findMany({
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const services: SmsServiceView[] = rows.map((s) => ({
    id: s.id,
    label: s.label,
    provider: s.provider,
    templateId: s.templateId,
    paramName: s.paramName,
    baseURL: s.baseURL,
    isSandbox: s.isSandbox,
    isActive: s.isActive,
    isDefault: s.isDefault,
    hasKey: Boolean(s.apiKey && s.apiKey.trim()),
    note: s.note,
  }));

  // ── سرویس فعال (برای بنر) ──────────────────────────────────────────────────
  const active = await getActiveSmsServiceInfo();

  // ── آخرین لاگ‌ها ───────────────────────────────────────────────────────────
  const logRows = await prisma.smsLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const initialLogs: SmsLogView[] = logRows.map((l) => ({
    id: l.id,
    provider: l.provider,
    purpose: l.purpose,
    purposeLabel: PURPOSE_LABELS[l.purpose] ?? l.purpose,
    phoneMasked: l.phoneMasked,
    success: l.success,
    status: l.status,
    messageId: l.messageId,
    error: l.error,
    isSandbox: l.isSandbox,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-ink">مدیریت پیامک</h1>
        <p className="text-sm text-stone mt-1 leading-relaxed max-w-xl">
          سرویس ارسال پیامک (کلید و قالب) را تنظیم می‌کنی، با «ارسال تستی» مسیر را می‌سنجی، و در «تاریخچهٔ ارسال» مطمئن می‌شوی ورودِ کاربران از مسیر درست می‌گذرد.
        </p>
      </header>

      {/* بنر سرویس فعال */}
      <ActiveServiceBanner active={active} />

      {/* ۱) سرویس‌ها */}
      <SmsServicesManager services={services} canManage={canManage} isOwner={owner} />

      {/* ۲) ارسال تستی + تاریخچه */}
      <SmsActivityPanel initialLogs={initialLogs} canSend={canSend} />
    </div>
  );
}

function ActiveServiceBanner({
  active,
}: {
  active: { provider: string; label: string; isSandbox: boolean; source: "db" | "env"; hasKey: boolean; ready: boolean };
}) {
  const isReal = active.provider === "smsir";
  const tone = active.ready
    ? isReal
      ? "border-sage/40 bg-sage/8"
      : "border-mist/40 bg-mist/10"
    : "border-ember/40 bg-ember/8";

  const providerText = isReal ? "sms.ir" : "آزمایشی (Mock)";

  return (
    <div className={`rounded-2xl border px-5 py-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] text-fog mb-0.5">سرویسِ فعالِ ارسال (همین الان روی سایت)</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink num-latin" dir="ltr">{providerText}</span>
            {active.isSandbox && isReal && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-700">سندباکس</span>
            )}
            <span className="text-xs text-stone">«{active.label}»</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-fog">
              {active.source === "db" ? "از پنل" : "از env (پیش‌فرضِ موقت)"}
            </span>
          </div>
        </div>
        <div className="text-xs">
          {active.ready ? (
            <span className="text-sage-deep">آمادهٔ ارسال ✓</span>
          ) : (
            <span className="text-ember">ناقص — کلید یا قالب تنظیم نشده</span>
          )}
        </div>
      </div>
      {!isReal && (
        <p className="text-[11px] text-fog mt-2 leading-relaxed">
          هشدار: مسیر فعال «آزمایشی» است و پیامک واقعی ارسال نمی‌شود. برای ارسال واقعی، یک سرویس sms.ir بساز و آن را «پیش‌فرض» کن.
        </p>
      )}
    </div>
  );
}
