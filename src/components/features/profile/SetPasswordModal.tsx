"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SetPasswordModal — مودالِ قفل‌شدهٔ تعیین رمز عبور پس از تأییدِ ایمیل (DECISION-080)
// کاربر نمی‌تواند آن را بدون تعیین رمز ببندد. پس از ثبت، صفحه رفرش می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

interface Props {
  userDisplayName: string | null;
}

export function SetPasswordModal({ userDisplayName }: Props) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const name = userDisplayName?.trim() || "کاربر عزیز";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("رمز عبور و تکرارش یکسان نیستند.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/account/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "ثبت رمز عبور ناموفق بود."); return; }

      // اگر کاربر نام‌کاربری وارد کرده، ذخیره کن
      if (username.trim()) {
        await fetch("/api/account/credentials", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim() }),
        });
      }

      router.refresh();
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-3xl bg-paper border border-black/10 shadow-2xl p-8 space-y-6 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* آیکون تأیید */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-sage/15 flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-deep">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">ایمیل تأیید شد، {name}!</h2>
            <p className="text-sm text-stone leading-relaxed mt-1.5">
              برای ورودهای بعدی به همسو، یک رمز عبور برای خودت تنظیم کن.
            </p>
            <p className="text-xs text-fog mt-1">
              ضمناً می‌توانی یک نام کاربری هم برای خودت انتخاب کنی.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* رمز عبور */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone">رمز عبور (حداقل ۸ کاراکتر)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              disabled={busy}
              dir="ltr"
              placeholder="••••••••"
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
            />
          </div>

          {/* تکرار رمز */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone">تکرار رمز عبور</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              disabled={busy}
              dir="ltr"
              placeholder="••••••••"
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage transition-colors disabled:opacity-50"
            />
          </div>

          {/* نام کاربری — اختیاری */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone">
              نام کاربری
              <span className="text-fog font-normal mr-1">(اختیاری)</span>
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fog text-sm select-none">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={busy}
                dir="ltr"
                autoCapitalize="none"
                placeholder="username"
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage transition-colors disabled:opacity-50 num-latin pr-7"
              />
            </div>
            <p className="text-[11px] text-fog">۳ تا ۲۴ کاراکتر؛ حروف کوچک انگلیسی، رقم و زیرخط.</p>
          </div>

          {error && (
            <p className="text-xs text-ember text-center animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || newPassword.length < 8 || !confirmPassword}
            className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {busy && <Spinner size={14} className="text-paper" />}
            ثبت رمز عبور
          </button>
        </form>
      </div>
    </div>
  );
}
