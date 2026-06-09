// ─────────────────────────────────────────────────────────────────────────────
// /admin/email — مدیریت ایمیل (DECISION-064)
//   - بنر «سرویس فعال»: نشان می‌دهد ارسال از کدام مسیر می‌رود (Resend/Mock)
//   - سرویس‌های ایمیل: CRUD (provider/apiKey/fromAddress)
//   - ارسال تستی + تاریخچهٔ ارسال
// enforce: email.read؛ تغییر: email.manage؛ ارسال تست: email.send؛ کلید: فقط Owner
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission, can, isOwner } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { getActiveEmailServiceInfo } from "@/lib/email/send";
import { EmailServicesManager, type EmailServiceView } from "@/components/admin/email/EmailServicesManager";
import { EmailActivityPanel } from "@/components/admin/email/EmailActivityPanel";
import type { EmailLogView } from "@/components/admin/email/EmailDeliveryLog";

export const dynamic = "force-dynamic";

const PURPOSE_LABELS: Record<string, string> = {
  signup: "ثبت‌نام",
  "add-email": "افزودن ایمیل",
  "password-reset": "بازیابی رمز",
  test: "ارسال تستی",
};

export default async function EmailPage() {
  const ctx = await requirePermission("email.read");
  const canManage = can(ctx, "email.manage");
  const canSend = can(ctx, "email.send");
  const owner = isOwner(ctx);

  const rows = await prisma.emailService.findMany({
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const services: EmailServiceView[] = rows.map((s) => ({
    id: s.id,
    label: s.label,
    provider: s.provider,
    fromAddress: s.fromAddress,
    fromName: s.fromName,
    isActive: s.isActive,
    isDefault: s.isDefault,
    hasKey: Boolean(s.apiKey && s.apiKey.trim()),
    note: s.note,
  }));

  const active = await getActiveEmailServiceInfo();

  const logRows = await prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const initialLogs: EmailLogView[] = logRows.map((l) => ({
    id: l.id,
    provider: l.provider,
    purpose: l.purpose,
    purposeLabel: PURPOSE_LABELS[l.purpose] ?? l.purpose,
    emailMasked: l.emailMasked,
    subject: l.subject,
    success: l.success,
    messageId: l.messageId,
    error: l.error,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-ink">مدیریت ایمیل</h1>
        <p className="text-sm text-stone mt-1 leading-relaxed max-w-xl">
          سرویس ارسال ایمیل (کلید Resend و آدرس فرستنده) را تنظیم می‌کنی، با «ارسال تستی» مسیر را می‌سنجی، و در «تاریخچهٔ ارسال» مطمئن می‌شوی همهٔ ایمیل‌های سیستمی از مسیر درست می‌گذرند.
        </p>
      </header>

      <ActiveServiceBanner active={active} />

      <EmailServicesManager services={services} canManage={canManage} isOwner={owner} />

      <EmailActivityPanel initialLogs={initialLogs} canSend={canSend} />
    </div>
  );
}

function ActiveServiceBanner({
  active,
}: {
  active: { provider: string; label: string; source: "db" | "mock"; hasKey: boolean; fromAddress: string; ready: boolean };
}) {
  const isReal = active.provider === "resend";
  const tone = active.ready
    ? isReal
      ? "border-sage/40 bg-sage/8"
      : "border-mist/40 bg-mist/10"
    : "border-ember/40 bg-ember/8";

  const providerText = isReal ? "Resend" : "آزمایشی (Mock)";

  return (
    <div className={`rounded-2xl border px-5 py-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] text-fog mb-0.5">سرویسِ فعالِ ارسال (همین الان روی سایت)</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink num-latin">{providerText}</span>
            <span className="text-xs text-stone">«{active.label}»</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-fog">
              {active.source === "db" ? "از پنل" : "fallback آزمایشی"}
            </span>
            {isReal && (
              <span className="text-[11px] text-fog num-latin" dir="ltr">{active.fromAddress}</span>
            )}
          </div>
        </div>
        <div className="text-xs">
          {active.ready ? (
            <span className="text-sage-deep">آمادهٔ ارسال ✓</span>
          ) : (
            <span className="text-ember">ناقص — کلید API تنظیم نشده</span>
          )}
        </div>
      </div>
      {!isReal && (
        <p className="text-[11px] text-fog mt-2 leading-relaxed">
          هشدار: مسیر فعال «آزمایشی» است و ایمیل واقعی ارسال نمی‌شود. برای ارسال واقعی، یک سرویس Resend بساز و آن را «پیش‌فرض» کن.
        </p>
      )}
    </div>
  );
}
