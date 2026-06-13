"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SetPasswordModal — مودالِ قفل‌شدهٔ تعیین رمز عبور پس از تأییدِ ایمیل (DECISION-080)
// مرحله ۲ (اختیاری): افزودن موبایل برای ورود سریع (DECISION-085)
// کاربر نمی‌تواند مودال را بدون تعیین رمز ببندد.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

interface Props {
  userDisplayName: string | null;
}

type Step = "password" | "phone";
type PhoneStep = "input" | "otp" | "done";

export function SetPasswordModal({ userDisplayName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");

  // ── مرحله ۱: رمز عبور ──
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // ── مرحله ۲: موبایل ──
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("input");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const name = userDisplayName?.trim() || "کاربر عزیز";

  async function submitPassword(e: React.FormEvent) {
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

      if (username.trim()) {
        await fetch("/api/account/credentials", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim() }),
        });
      }

      // به جای refresh فوری، مرحله دوم (موبایل) را نشان می‌دهیم
      setStep("phone");
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError("");
    setPhoneBusy(true);
    try {
      const res = await fetch("/api/account/phone/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const d = await res.json();
      if (!res.ok) { setPhoneError(d.error ?? "ارسال کد ناموفق بود."); return; }
      setPhoneStep("otp");
    } catch {
      setPhoneError("اتصال به سرور برقرار نشد.");
    } finally {
      setPhoneBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError("");
    setPhoneBusy(true);
    try {
      const res = await fetch("/api/account/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const d = await res.json();
      if (!res.ok) { setPhoneError(d.error ?? "کد نادرست است."); return; }
      setPhoneStep("done");
      // نمایش لحظه‌ای موفقیت، سپس refresh
      setTimeout(() => router.refresh(), 1200);
    } catch {
      setPhoneError("اتصال به سرور برقرار نشد.");
    } finally {
      setPhoneBusy(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // رندر مرحله ۱ — رمز عبور
  // ─────────────────────────────────────────────────────────────────
  if (step === "password") {
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

          <form onSubmit={submitPassword} className="space-y-4">
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

  // ─────────────────────────────────────────────────────────────────
  // رندر مرحله ۲ — پیوند اختیاری موبایل
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-3xl bg-paper border border-black/10 shadow-2xl p-8 space-y-6 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* موفقیت کامل */}
        {phoneStep === "done" ? (
          <div className="flex flex-col items-center text-center space-y-3 py-4">
            <div className="w-14 h-14 rounded-full bg-sage/15 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-deep">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">موبایل متصل شد</h2>
              <p className="text-sm text-stone mt-1.5">از این پس می‌توانید با شماره موبایل هم وارد شوید.</p>
            </div>
          </div>
        ) : (
          <>
            {/* هدر */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-bone flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-stone">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">ورود سریع با موبایل</h2>
                <p className="text-sm text-stone leading-relaxed mt-1">
                  با ثبت شماره موبایل، دفعه‌ی بعد بدون رمز وارد شوید.
                </p>
                <p className="text-xs text-fog mt-0.5">(اختیاری — می‌توانید از تنظیمات هم اضافه کنید)</p>
              </div>
            </div>

            {/* فرم ورود شماره */}
            {phoneStep === "input" && (
              <form onSubmit={requestOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone">شماره موبایل</label>
                  <input
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                    disabled={phoneBusy}
                    dir="ltr"
                    placeholder="۰۹۱۲ *** ****"
                    className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage transition-colors disabled:opacity-50 text-center tracking-widest"
                  />
                </div>

                {/* هشدار فیلتر پیامک */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5 shrink-0">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    اگر پیامک‌های تبلیغاتی یا ناشناس را مسدود کرده‌اید، ممکن است کد تأیید را دریافت نکنید.
                  </p>
                </div>

                {phoneError && (
                  <p className="text-xs text-ember text-center animate-fade-in">{phoneError}</p>
                )}

                <button
                  type="submit"
                  disabled={phoneBusy || phone.trim().length < 10}
                  className="w-full py-3 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {phoneBusy && <Spinner size={14} className="text-paper" />}
                  ارسال کد تأیید
                </button>

                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="w-full text-xs text-fog hover:text-stone transition-colors py-1"
                >
                  رد کردن — بعداً از تنظیمات اضافه می‌کنم
                </button>
              </form>
            )}

            {/* فرم تأیید کد OTP */}
            {phoneStep === "otp" && (
              <form onSubmit={verifyOtp} className="space-y-4">
                <p className="text-xs text-stone text-center">
                  کد ۶ رقمی به شماره{" "}
                  <span className="font-medium text-ink" dir="ltr">{phone}</span>{" "}
                  ارسال شد.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone">کد تأیید</label>
                  <input
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setPhoneError(""); }}
                    disabled={phoneBusy}
                    dir="ltr"
                    maxLength={6}
                    placeholder="_ _ _ _ _ _"
                    className="w-full rounded-xl px-3 py-3 text-lg bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage transition-colors disabled:opacity-50 text-center tracking-[0.4em]"
                  />
                </div>

                {phoneError && (
                  <p className="text-xs text-ember text-center animate-fade-in">{phoneError}</p>
                )}

                <button
                  type="submit"
                  disabled={phoneBusy || otpCode.length < 4}
                  className="w-full py-3 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {phoneBusy && <Spinner size={14} className="text-paper" />}
                  تأیید و اتصال موبایل
                </button>

                <div className="flex justify-between text-xs text-fog">
                  <button type="button" onClick={() => setPhoneStep("input")} className="hover:text-stone transition-colors">
                    تغییر شماره
                  </button>
                  <button type="button" onClick={() => router.refresh()} className="hover:text-stone transition-colors">
                    رد کردن
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
