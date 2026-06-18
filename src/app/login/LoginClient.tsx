"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DevOnly } from "@/components/dev/DevOnly";
import { DevOtpPanel } from "@/components/dev/DevOtpPanel";
import { AmbientField } from "@/components/layout/AmbientField";
import { toFaDigits } from "@/lib/utils/digits";
import {
  isValidIranMobile,
  isValidIdentifier,
  isValidEmail,
  VALIDATION_MSG,
} from "@/lib/utils/validation";
import { Spinner } from "@/components/ui/Spinner";
import { TermsModal } from "@/components/features/auth/TermsModal";

// ─────────────────────────────────────────────────────────────────────────────
// LoginClient — فرمِ ورودِ همسو (DECISION-058) — دو روش:
//   • موبایل (OTP) — روشِ سریعِ پیش‌فرض
//   • ایمیل / نام‌کاربری + پسورد — ورود یا ثبت‌نام (ثبت‌نام با تأییدِ کدِ ایمیل)
// ─────────────────────────────────────────────────────────────────────────────

type Method = "mobile" | "email";

/** فقط مسیر نسبی امن مجاز است — جلوگیری از open redirect */
function safeReturnUrl(raw: string | null): string {
  if (!raw) return "";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "";
  return raw;
}

/** آخرین صفحه عمومی که tracker ذخیره کرده — fallback وقتی returnUrl صریح نیست */
function getPrevPublicPage(): string {
  try {
    const stored = sessionStorage.getItem("hamsoo_prev_public");
    if (!stored || !stored.startsWith("/") || stored.startsWith("//")) return "";
    if (
      stored.startsWith("/login") ||
      stored.startsWith("/dashboard") ||
      stored.startsWith("/admin") ||
      stored.startsWith("/onboarding")
    ) return "";
    return stored;
  } catch {
    return "";
  }
}

// ظرفِ ارتفاع-نرم: تغییرِ ارتفاعِ محتوا (سوییچ تب/مرحله) را با گذارِ آرام انیمیت می‌کند.
function SmoothHeight({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    setHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      style={{
        height: height ?? "auto",
        overflow: "hidden",
        transition: "height 420ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

export function LoginClient() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const params = useSearchParams();
  const returnUrl = safeReturnUrl(params.get("returnUrl"));
  const [method, setMethod] = useState<Method>("mobile");
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-4">
      <AmbientField />

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        {/* لوگو */}
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="همسو" width={48} height={48} className="opacity-90" priority />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-ink tracking-tight mb-2">ورود به همسو</h1>
          <p className="text-sm text-stone leading-relaxed">روشی که راحت‌تری را انتخاب کن</p>
        </div>

        {/* سوییچِ روش */}
        <div className="glass-strong rounded-2xl p-1.5 mb-4 grid grid-cols-2 gap-1.5">
          <TabButton active={method === "mobile"} onClick={() => setMethod("mobile")}>
            موبایل
          </TabButton>
          <TabButton active={method === "email"} onClick={() => setMethod("email")}>
            ایمیل / نام کاربری
          </TabButton>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <SmoothHeight>
            <div key={method} className="animate-fade-in">
              {method === "mobile" ? <MobileFlow returnUrl={returnUrl} /> : <EmailFlow returnUrl={returnUrl} />}
            </div>
          </SmoothHeight>
        </div>

        <p className="text-center text-xs text-fog mt-6 leading-6">
          ورود به معنای پذیرش{" "}
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-stone hover:text-ink transition-colors underline underline-offset-2"
          >
            قوانین استفاده
          </button>{" "}
          است.
        </p>
      </div>

      <TermsModal isOpen={termsOpen} onAccept={() => setTermsOpen(false)} />
    </main>
  );
}

// ═════════════════════════ روشِ موبایل (OTP) ═══════════════════════════════════
type MobileStep = "phone" | "otp";

function MobileFlow({ returnUrl }: { returnUrl: string }) {
  const [step, setStep] = useState<MobileStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { phoneInputRef.current?.focus(); }, []);
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidIranMobile(phone)) { setError(VALIDATION_MSG.mobile); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطایی رخ داد."); return; }
      if (typeof data.devCode === "string") setDevCode(data.devCode);
      setStep("otp");
      setCountdown(120);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally { setLoading(false); }
  }

  function handleDevAutoFill(code: string) {
    const digits = code.slice(0, 6).split("");
    const next = ["", "", "", "", "", ""];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    setError("");
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("کد ۶ رقمی را وارد کن."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطایی رخ داد."); return; }
      // کاربرِ تازه‌وارد → onboarding؛ returnUrl صریح یا صفحه قبل → برگشت؛ بقیه → داشبورد
      window.location.href = data.isNew ? "/onboarding" : (returnUrl || getPrevPublicPage() || "/dashboard");
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally { setLoading(false); }
  }

  function handleOtpInput(index: number, value: string) {
    const digit = value.replace(/[^۰-۹0-9]/g, "").slice(-1);
    const latin = digit.replace(/[۰-۹]/g, (d) => String(d.codePointAt(0)! - 0x06f0));
    const next = [...otp];
    next[index] = latin;
    setOtp(next);
    if (latin && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  async function handleResend() {
    if (countdown > 0) return;
    setOtp(["", "", "", "", "", ""]); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (typeof data.devCode === "string") setDevCode(data.devCode);
      setCountdown(120);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("ارسال مجدد ناموفق بود.");
    } finally { setLoading(false); }
  }

  if (step === "phone") {
    return (
      <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-xs font-medium text-stone">شماره موبایل</label>
          <input
            ref={phoneInputRef}
            id="phone" type="tel" inputMode="numeric" placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(""); }}
            disabled={loading} dir="ltr"
            suppressHydrationWarning
            className="w-full rounded-xl px-4 py-3 text-center text-lg tracking-widest bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-350 disabled:opacity-50"
          />
        </div>
        {error && <p className="text-xs text-ember text-center animate-fade-in">{error}</p>}
        <button
          type="submit" disabled={loading || !phone.trim()}
          className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Spinner size={14} className="text-paper" />}
          دریافت کد
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
      <div className="text-center space-y-1">
        <p className="text-xs text-stone">
          کد ارسال‌شده به{" "}
          <span className="font-medium text-ink fa-num" dir="ltr">{toFaDigits(phone)}</span>
        </p>
        <button
          type="button"
          onClick={() => { setStep("phone"); setError(""); setOtp(["","","","","",""]); }}
          className="text-[11px] text-sage-deep hover:text-ink transition-colors"
        >
          تغییر شماره
        </button>
      </div>

      <div className="flex gap-2 justify-center" dir="ltr">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={digit}
            onChange={(e) => handleOtpInput(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            disabled={loading}
            className="w-10 h-12 text-center text-xl font-semibold rounded-xl bg-white/60 border border-bone text-ink focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-200 disabled:opacity-50"
          />
        ))}
      </div>

      {error && <p className="text-xs text-ember text-center animate-fade-in">{error}</p>}

      <button
        type="submit" disabled={loading || otp.join("").length < 6}
        className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Spinner size={14} className="text-paper" />}
        ورود
      </button>

      <button
        type="button" onClick={handleResend} disabled={countdown > 0 || loading}
        className="text-xs text-stone hover:text-sage-deep transition-colors duration-200 disabled:opacity-50 disabled:cursor-default"
      >
        {countdown > 0 ? `ارسال مجدد تا ${toFaDigits(String(countdown))} ثانیه دیگر` : "ارسال مجدد کد"}
      </button>

      <DevOnly>
        <DevOtpPanel code={devCode} onFill={handleDevAutoFill} />
      </DevOnly>
    </form>
  );
}

// ═════════════════════════ روشِ ایمیل / نام‌کاربری ═════════════════════════════
type EmailMode = "login" | "signup";

function EmailFlow({ returnUrl }: { returnUrl: string }) {
  const [mode, setMode] = useState<EmailMode>("login");
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-center gap-1 text-xs">
        <SubTab active={mode === "login"} onClick={() => setMode("login")}>ورود</SubTab>
        <span className="text-fog">·</span>
        <SubTab active={mode === "signup"} onClick={() => setMode("signup")}>ثبت‌نام</SubTab>
      </div>
      {mode === "login" ? <EmailLogin returnUrl={returnUrl} /> : <EmailSignup />}
    </div>
  );
}

function EmailLogin({ returnUrl }: { returnUrl: string }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidIdentifier(identifier)) { setError(VALIDATION_MSG.identifier); return; }
    if (!password) { setError(VALIDATION_MSG.passwordEmpty); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطایی رخ داد."); return; }
      window.location.href = returnUrl || getPrevPublicPage() || "/dashboard";
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Labeled label="ایمیل یا نام کاربری">
        <input
          value={identifier} onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
          disabled={loading} dir="ltr" autoCapitalize="none"
          className={`${emailInp} num-latin`}
        />
      </Labeled>
      <Labeled label="رمز عبور">
        <input
          type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
          disabled={loading} dir="ltr" className={emailInp}
        />
      </Labeled>
      {error && <p className="text-xs text-ember text-center animate-fade-in">{error}</p>}
      <button
        type="submit" disabled={loading || !identifier.trim() || !password}
        className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Spinner size={14} className="text-paper" />}
        ورود
      </button>
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-xs text-stone hover:text-ink transition-colors"
        >
          رمز عبور را فراموش کردم
        </Link>
      </div>
    </form>
  );
}

type SignupStep = "form" | "waiting";

function EmailSignup() {
  const [step, setStep] = useState<SignupStep>("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) { setError(VALIDATION_MSG.email); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/email/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطایی رخ داد."); return; }
      setStep("waiting");
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally { setLoading(false); }
  }

  async function resend() {
    setError(""); setLoading(true);
    try {
      await fetch("/api/auth/email/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      setError("ارسال مجدد ناموفق بود.");
    } finally { setLoading(false); }
  }

  if (step === "form") {
    return (
      <form onSubmit={requestLink} className="flex flex-col gap-4">
        <Labeled label="ایمیل">
          <input
            type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
            disabled={loading} dir="ltr" autoCapitalize="none" placeholder="you@example.com"
            className={`${emailInp} num-latin`}
          />
        </Labeled>
        {error && <p className="text-xs text-ember text-center animate-fade-in">{error}</p>}
        <button
          type="submit" disabled={loading || !email.trim()}
          className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Spinner size={14} className="text-paper" />}
          ارسال لینک تأیید
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-center">
      <div className="w-14 h-14 rounded-full bg-sage/15 flex items-center justify-center mx-auto">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sage-deep">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-ink">لینک تأیید ارسال شد</p>
        <p className="text-xs text-stone leading-relaxed">
          ایمیلی به{" "}
          <span className="font-medium text-ink num-latin" dir="ltr">{email}</span>{" "}
          فرستادیم. روی لینک داخل آن کلیک کن تا حسابت تأیید شود.
        </p>
      </div>

      {error && <p className="text-xs text-ember animate-fade-in">{error}</p>}

      <div className="flex items-center justify-center gap-3 text-xs">
        <button
          type="button" onClick={resend} disabled={loading}
          className="flex items-center gap-1.5 text-stone hover:text-sage-deep transition-colors disabled:opacity-50"
        >
          {loading && <Spinner size={12} className="text-stone" />}
          ارسال مجدد
        </button>
        <span className="text-fog">·</span>
        <button
          type="button"
          onClick={() => { setStep("form"); setError(""); }}
          className="text-stone hover:text-ink transition-colors"
        >
          تغییر ایمیل
        </button>
      </div>
    </div>
  );
}

// ─── کامپوننت‌های کمکی ────────────────────────────────────────────────────────
const emailInp =
  "w-full rounded-xl px-4 py-3 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-350 disabled:opacity-50";

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
        active ? "bg-ink text-paper shadow-paper-sm" : "text-stone hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function SubTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`px-2 py-1 rounded-lg transition-colors ${active ? "text-ink font-semibold" : "text-fog hover:text-stone"}`}
    >
      {children}
    </button>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone">{label}</label>
      {children}
    </div>
  );
}
