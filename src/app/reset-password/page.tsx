"use client";

// ─────────────────────────────────────────────────────────────────────────────
// /reset-password — تنظیم رمز جدید
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AmbientField } from "@/components/layout/AmbientField";
import { Spinner } from "@/components/ui/Spinner";

type Stage = "checking" | "invalid" | "form" | "success";

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [stage, setStage] = useState<Stage>("checking");
  const [tokenError, setTokenError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!token) { setStage("invalid"); setTokenError("لینک بازیابی نادرست است."); return; }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) { setStage("form"); }
        else { setStage("invalid"); setTokenError(d.error ?? "لینک نادرست یا منقضی است."); }
      })
      .catch(() => { setStage("invalid"); setTokenError("اتصال به سرور برقرار نشد."); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setFormError("رمز باید حداقل ۸ کاراکتر باشد."); return; }
    if (password !== confirm) { setFormError("رمزهای وارد‌شده یکسان نیستند."); return; }
    setFormError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "خطایی رخ داد."); return; }
      setStage("success");
    } catch {
      setFormError("اتصال به سرور برقرار نشد.");
    } finally { setLoading(false); }
  }

  return (
    <div className="glass-strong rounded-2xl p-6">
      {stage === "checking" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <span className="inline-block w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone">در حال بررسی لینک…</p>
        </div>
      )}

      {stage === "invalid" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-ember/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ember">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-ink">لینک نامعتبر</p>
            <p className="text-xs text-stone leading-relaxed">{tokenError}</p>
          </div>
          <Link href="/forgot-password" className="text-xs text-stone hover:text-ink transition-colors">
            درخواست لینک جدید
          </Link>
        </div>
      )}

      {stage === "form" && (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="space-y-1.5 text-center">
            <h1 className="text-base font-semibold text-ink">رمز جدید</h1>
            <p className="text-xs text-stone">رمز عبور جدید حسابت را وارد کن.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone">رمز عبور جدید (حداقل ۸ کاراکتر)</label>
            <input
              type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setFormError(""); }}
              disabled={loading} dir="ltr"
              className="w-full rounded-xl px-4 py-3 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-350 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone">تکرار رمز عبور</label>
            <input
              type="password" value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setFormError(""); }}
              disabled={loading} dir="ltr"
              className="w-full rounded-xl px-4 py-3 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-350 disabled:opacity-50"
            />
          </div>

          {formError && <p className="text-xs text-ember text-center animate-fade-in">{formError}</p>}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Spinner size={14} className="text-paper" />}
            ثبت رمز جدید
          </button>
        </form>
      )}

      {stage === "success" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-sage/15 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-deep">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-ink">رمز تغییر کرد</p>
            <p className="text-xs text-stone">اکنون با رمز جدید وارد شو.</p>
          </div>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
          >
            ورود به همسو
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-4">
      <AmbientField />
      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="همسو" width={48} height={48} className="opacity-90" priority />
        </div>
        <Suspense fallback={
          <div className="glass-strong rounded-2xl p-6 flex flex-col items-center gap-4">
            <span className="inline-block w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-stone">در حال بارگذاری…</p>
          </div>
        }>
          <ResetPasswordInner />
        </Suspense>
      </div>
    </main>
  );
}
