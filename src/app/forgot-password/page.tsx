"use client";

// ─────────────────────────────────────────────────────────────────────────────
// /forgot-password — فراموشی رمز عبور
//
// کاربر ایمیل وارد می‌کند → لینک بازیابی به ایمیل ثبت‌شده ارسال می‌شود.
// پاسخ همیشه موفق (security: user enumeration جلوگیری می‌شود).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DevOnly } from "@/components/dev/DevOnly";
import { AmbientField } from "@/components/layout/AmbientField";
import { Spinner } from "@/components/ui/Spinner";

type Step = "form" | "sent";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devLink, setDevLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطایی رخ داد."); return; }
      if (typeof data.devLink === "string") setDevLink(data.devLink);
      setStep("sent");
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally { setLoading(false); }
  }

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-4">
      <AmbientField />

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="همسو" width={48} height={48} className="opacity-90" priority />
        </div>

        <div className="glass-strong rounded-2xl p-6">
          {step === "form" ? (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div className="space-y-1.5 text-center">
                <h1 className="text-base font-semibold text-ink">بازیابی رمز عبور</h1>
                <p className="text-xs text-stone leading-relaxed">
                  ایمیل حسابت را وارد کن. لینک بازیابی برایت ارسال می‌شود.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-stone">ایمیل</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  disabled={loading}
                  dir="ltr"
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  className="w-full rounded-xl px-4 py-3 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-350 disabled:opacity-50"
                />
              </div>

              {error && <p className="text-xs text-ember text-center animate-fade-in">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Spinner size={14} className="text-paper" />}
                ارسال لینک بازیابی
              </button>

              <div className="text-center">
                <Link href="/login" className="text-xs text-stone hover:text-ink transition-colors">
                  بازگشت به ورود
                </Link>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-5 text-center">
              <div className="w-14 h-14 rounded-full bg-sage/15 flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sage-deep">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-ink">لینک ارسال شد</p>
                <p className="text-xs text-stone leading-relaxed">
                  اگر حسابی با این مشخصات وجود داشته باشد، لینک بازیابی رمز به ایمیل آن ارسال شده است.
                </p>
              </div>

              <DevOnly>
                {devLink && (
                  <a
                    href={devLink}
                    className="text-xs px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors block"
                  >
                    [DEV] باز کردن لینک بازیابی
                  </a>
                )}
              </DevOnly>

              <Link href="/login" className="text-xs text-stone hover:text-ink transition-colors">
                بازگشت به ورود
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
