"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DevOnly } from "@/components/dev/DevOnly";
import { DevOtpPanel } from "@/components/dev/DevOtpPanel";
import { AmbientField } from "@/components/layout/AmbientField";
import { toFaDigits } from "@/lib/utils/digits";

// ─────────────────────────────────────────────────────────────────────────────
// صفحهٔ ورود همسو (DECISION-058) — دو روش:
//   • موبایل (OTP) — روشِ سریعِ پیش‌فرض
//   • ایمیل / نام‌کاربری + پسورد — ورود یا ثبت‌نام (ثبت‌نام با تأییدِ کدِ ایمیل)
// نام‌کاربری فعلاً اختیاری است؛ با شبکهٔ اجتماعی اجباری می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

type Method = "mobile" | "email";

export default function LoginPage() {
  const [method, setMethod] = useState<Method>("mobile");

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
          {method === "mobile" ? <MobileFlow /> : <EmailFlow />}
        </div>

        <p className="text-center text-xs text-fog mt-6 leading-6">
          ورود به معنای پذیرش{" "}
          <a href="#" className="text-stone hover:text-ink transition-colors">قوانین</a> است.
        </p>
      </div>
    </main>
  );
}

// ═════════════════════════ روشِ موبایل (OTP) ═══════════════════════════════════
type MobileStep = "phone" | "otp";

function MobileFlow() {
  const router = useRouter();
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
      router.push("/dashboard");
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
            className="w-full rounded-xl px-4 py-3 text-center text-lg tracking-widest bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-350 disabled:opacity-50"
          />
        </div>
        {error && <p className="text-xs text-ember text-center animate-fade-in">{error}</p>}
        <button
          type="submit" disabled={loading || !phone.trim()}
          className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "در حال ارسال…" : "دریافت کد"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
      <p className="text-xs text-center text-stone -mt-1">
        کد ارسال‌شده به{" "}
        <span
          className="font-medium text-ink cursor-pointer" dir="ltr"
          onClick={() => { setStep("phone"); setError(""); setOtp(["","","","","",""]); }}
          title="تغییر شماره"
        >
          {toFaDigits(phone)}
        </span>
      </p>

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
        className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "در حال بررسی…" : "ورود"}
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

function EmailFlow() {
  const [mode, setMode] = useState<EmailMode>("login");
  return (
    <div className="flex flex-col gap-5">
      {/* سوییچِ ورود/ثبت‌نام */}
      <div className="flex items-center justify-center gap-1 text-xs">
        <SubTab active={mode === "login"} onClick={() => setMode("login")}>ورود</SubTab>
        <span className="text-fog">·</span>
        <SubTab active={mode === "signup"} onClick={() => setMode("signup")}>ثبت‌نام</SubTab>
      </div>
      {mode === "login" ? <EmailLogin /> : <EmailSignup />}
    </div>
  );
}

function EmailLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطایی رخ داد."); return; }
      router.push("/dashboard");
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
        className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "در حال بررسی…" : "ورود"}
      </button>
    </form>
  );
}

type SignupStep = "form" | "code";

function EmailSignup() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/email/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطایی رخ داد."); return; }
      if (typeof data.devCode === "string") setDevCode(data.devCode);
      setStep("code");
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally { setLoading(false); }
  }

  function fillCode(c: string) {
    const digits = c.slice(0, 6).split("");
    const next = ["", "", "", "", "", ""];
    digits.forEach((d, i) => { next[i] = d; });
    setCode(next);
    setError("");
    codeRefs.current[Math.min(digits.length, 5)]?.focus();
  }

  function codeInput(i: number, value: string) {
    const digit = value.replace(/[^۰-۹0-9]/g, "").slice(-1);
    const latin = digit.replace(/[۰-۹]/g, (d) => String(d.codePointAt(0)! - 0x06f0));
    const next = [...code];
    next[i] = latin;
    setCode(next);
    if (latin && i < 5) codeRefs.current[i + 1]?.focus();
  }

  function codeKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[i] && i > 0) codeRefs.current[i - 1]?.focus();
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const c = code.join("");
    if (c.length < 6) { setError("کد ۶ رقمی را وارد کن."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: c }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطایی رخ داد."); return; }
      router.push("/dashboard");
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally { setLoading(false); }
  }

  if (step === "form") {
    return (
      <form onSubmit={requestCode} className="flex flex-col gap-4">
        <Labeled label="ایمیل">
          <input
            type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
            disabled={loading} dir="ltr" autoCapitalize="none" placeholder="you@example.com"
            className={`${emailInp} num-latin`}
          />
        </Labeled>
        <Labeled label="رمز عبور (حداقل ۸ کاراکتر)">
          <input
            type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
            disabled={loading} dir="ltr" className={emailInp}
          />
        </Labeled>
        {error && <p className="text-xs text-ember text-center animate-fade-in">{error}</p>}
        <button
          type="submit" disabled={loading || !email.trim() || password.length < 8}
          className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "در حال ارسال…" : "ارسال کد تأیید"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="flex flex-col gap-6">
      <p className="text-xs text-center text-stone -mt-1">
        کد ارسال‌شده به{" "}
        <span
          className="font-medium text-ink cursor-pointer num-latin" dir="ltr"
          onClick={() => { setStep("form"); setError(""); setCode(["","","","","",""]); }}
          title="تغییر ایمیل"
        >
          {email}
        </span>
      </p>

      <div className="flex gap-2 justify-center" dir="ltr">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { codeRefs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={digit}
            onChange={(e) => codeInput(i, e.target.value)}
            onKeyDown={(e) => codeKeyDown(i, e)}
            disabled={loading}
            className="w-10 h-12 text-center text-xl font-semibold rounded-xl bg-white/60 border border-bone text-ink focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-200 disabled:opacity-50"
          />
        ))}
      </div>

      {error && <p className="text-xs text-ember text-center animate-fade-in">{error}</p>}

      <button
        type="submit" disabled={loading || code.join("").length < 6}
        className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "در حال بررسی…" : "تأیید و ورود"}
      </button>

      <DevOnly>
        <DevOtpPanel code={devCode} onFill={fillCode} />
      </DevOnly>
    </form>
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
