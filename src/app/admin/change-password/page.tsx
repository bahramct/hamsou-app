// ─────────────────────────────────────────────────────────────────────────────
// /admin/change-password — تغییر رمز ادمین (DECISION-038)
// بیرون از گروه (panel): بدون shell. middleware احراز هویت ادمین را تضمین می‌کند.
// اگر mustChangePassword باشد، (panel)/layout کاربر را به اینجا می‌فرستد.
// ─────────────────────────────────────────────────────────────────────────────

import { requireAdmin } from "@/lib/admin/auth-server";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const ctx = await requireAdmin();
  const forced = ctx.admin.mustChangePassword;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 bg-paper">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-ink tracking-tight mb-2">
            {forced ? "تعیین رمز جدید" : "تغییر رمز عبور"}
          </h1>
          <p className="text-sm text-stone leading-relaxed">
            {forced
              ? "برای ادامه، یک رمز جدید و شخصی برای حساب خود انتخاب کن."
              : `حساب: ${ctx.admin.username}`}
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <ChangePasswordForm forced={forced} />
        </div>

        {!forced && (
          <p className="text-center text-xs text-fog mt-6">
            <a href="/admin" className="hover:text-ink transition-colors">بازگشت به پنل</a>
          </p>
        )}
      </div>
    </main>
  );
}
