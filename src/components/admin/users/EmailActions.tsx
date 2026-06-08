"use client";

// ─────────────────────────────────────────────────────────────────────────────
// EmailActions — تأیید دستی ایمیل و ارسال لینک بازیابی رمز (admin user detail)
// فقط با canWrite=true اکشن‌ها نمایش داده می‌شوند.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";


interface Props {
  userId: string;
  email: string | null;
  emailVerifiedAt: string | null; // ISO string یا null
  hasPassword: boolean;
  canWrite: boolean;
}

export function EmailActions({ userId, email, emailVerifiedAt, hasPassword, canWrite }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  if (!email) return null;

  const isVerified = Boolean(emailVerifiedAt);

  async function verifyEmail() {
    if (verifyBusy) return;
    setVerifyBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify-email`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "خطا در تأیید ایمیل."); return; }
      toast.success("ایمیل تأیید شد.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setVerifyBusy(false);
    }
  }

  async function sendResetLink() {
    if (resetBusy) return;
    setResetBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/send-password-reset`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "خطا در ارسال لینک."); return; }
      toast.success("لینک بازیابی رمز ارسال شد.");
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-stone">مدیریت ایمیل</h3>

      {/* وضعیت تأیید ایمیل */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone text-xs">وضعیت ایمیل</span>
        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
          isVerified ? "bg-sage/15 text-sage-deep" : "bg-ember/10 text-ember"
        }`}>
          {isVerified ? "تأیید‌شده" : "تأیید‌نشده"}
        </span>
      </div>

      {canWrite && (
        <div className="flex flex-col gap-2">
          {!isVerified && (
            <button
              type="button"
              onClick={verifyEmail}
              disabled={verifyBusy}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-medium bg-sage/15 text-sage-deep hover:bg-sage/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyBusy && <Spinner size={14} />}
              تأیید دستی ایمیل
            </button>
          )}

          {hasPassword && (
            <button
              type="button"
              onClick={sendResetLink}
              disabled={resetBusy}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-medium bg-black/6 text-stone hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetBusy && <Spinner size={14} />}
              ارسال لینک بازیابی رمز
            </button>
          )}
        </div>
      )}
    </div>
  );
}
