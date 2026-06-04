"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DevOnly } from "@/components/dev/DevOnly";
import { DevOtpPanel } from "@/components/dev/DevOtpPanel";
import { AmbientField } from "@/components/layout/AmbientField";
import { toFaDigits } from "@/lib/utils/digits";

// ─────────────────────────────────────────────────────────────────────────────
// صفحه ورود همسو — ۲ مرحله: شماره موبایل → کد OTP
// ─────────────────────────────────────────────────────────────────────────────

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  // فقط در حالت dev مقدار می‌گیرد — در prod، API اصلاً این فیلد را برنمی‌گرداند.
  const [devCode, setDevCode] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // فوکوس اتوماتیک روی input شماره
  useEffect(() => {
    phoneInputRef.current?.focus();
  }, []);

  // شمارش معکوس برای ارسال مجدد
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ─── مرحله ۱: درخواست OTP ────────────────────────────────────────────────
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد.");
        return;
      }

      // اگر API در حالت dev بود، کد را در state ذخیره می‌کنیم تا DevOtpPanel نمایش دهد.
      // در prod، data.devCode وجود ندارد و این مقدار `null` می‌ماند.
      if (typeof data.devCode === "string") {
        setDevCode(data.devCode);
      }

      setStep("otp");
      setCountdown(120); // ۲ دقیقه تا ارسال مجدد
      // فوکوس روی اولین خانه OTP
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  // ─── پر کردن خودکار کد OTP از پنل dev ─────────────────────────────────────
  function handleDevAutoFill(code: string) {
    const digits = code.slice(0, 6).split("");
    const next = ["", "", "", "", "", ""];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    setError("");
    // فوکوس روی خانه بعد از آخرین رقم (یا آخرین خانه)
    const focusIndex = Math.min(digits.length, 5);
    otpRefs.current[focusIndex]?.focus();
  }

  // ─── مرحله ۲: تأیید OTP ──────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("کد ۶ رقمی را وارد کن.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  // ─── تایپ در خانه‌های OTP ─────────────────────────────────────────────────
  function handleOtpInput(index: number, value: string) {
    // فقط عدد (فارسی یا لاتین)
    const digit = value.replace(/[^۰-۹0-9]/g, "").slice(-1);
    // تبدیل عدد فارسی به لاتین
    const latin = digit.replace(/[۰-۹]/g, (d) =>
      String(d.codePointAt(0)! - 0x06f0)
    );

    const next = [...otp];
    next[index] = latin;
    setOtp(next);

    if (latin && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  // ─── ارسال مجدد ──────────────────────────────────────────────────────────
  async function handleResend() {
    if (countdown > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (typeof data.devCode === "string") {
        setDevCode(data.devCode);
      }
      setCountdown(120);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("ارسال مجدد ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }

  // ─── رندر ────────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-4">
      {/* اتمسفرِ نرمِ پس‌زمینه */}
      <AmbientField />

      {/* کارت */}
      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        {/* لوگو */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.png"
            alt="همسو"
            width={48}
            height={48}
            className="opacity-90"
            priority
          />
        </div>

        {/* عنوان */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-ink tracking-tight mb-2">
            {step === "phone" ? "ورود به همسو" : "کد تأیید"}
          </h1>
          <p className="text-sm text-stone leading-relaxed">
            {step === "phone"
              ? "شماره موبایل خود را وارد کن"
              : (
                <>
                  کد ارسال‌شده به{" "}
                  <span
                    className="font-medium text-ink cursor-pointer"
                    onClick={() => { setStep("phone"); setError(""); setOtp(["","","","","",""]); }}
                    title="تغییر شماره"
                    dir="ltr"
                  >
                    {toFaDigits(phone)}
                  </span>
                </>
              )}
          </p>
        </div>

        {/* فرم */}
        <div className="glass-strong rounded-2xl p-6">
          {step === "phone" ? (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs font-medium text-stone">
                  شماره موبایل
                </label>
                <input
                  ref={phoneInputRef}
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(""); }}
                  disabled={loading}
                  dir="ltr"
                  className="
                    w-full rounded-xl px-4 py-3 text-center text-lg tracking-widest
                    bg-white/60 border border-bone
                    text-ink placeholder:text-fog
                    focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20
                    transition-all duration-350
                    disabled:opacity-50
                  "
                />
              </div>

              {error && (
                <p className="text-xs text-ember text-center animate-fade-in">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="
                  w-full py-3.5 rounded-xl
                  bg-ink text-paper text-sm font-medium
                  hover:bg-charcoal active:scale-[0.98]
                  transition-all duration-350
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                {loading ? "در حال ارسال…" : "دریافت کد"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
              {/* خانه‌های OTP */}
              <div className="flex gap-2 justify-center" dir="ltr">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    className="
                      w-10 h-12 text-center text-xl font-semibold rounded-xl
                      bg-white/60 border border-bone
                      text-ink
                      focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20
                      transition-all duration-200
                      disabled:opacity-50
                    "
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-ember text-center animate-fade-in">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="
                  w-full py-3.5 rounded-xl
                  bg-ink text-paper text-sm font-medium
                  hover:bg-charcoal active:scale-[0.98]
                  transition-all duration-350
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                {loading ? "در حال بررسی…" : "ورود"}
              </button>

              {/* ارسال مجدد */}
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="text-xs text-stone hover:text-sage-deep transition-colors duration-200 disabled:opacity-50 disabled:cursor-default"
              >
                {countdown > 0
                  ? `ارسال مجدد تا ${toPersianNum(countdown)} ثانیه دیگر`
                  : "ارسال مجدد کد"}
              </button>
            </form>
          )}

          {/* پنل dev — نمایش کد OTP و auto-fill. در prod کل این بلوک حذف می‌شود. */}
          {step === "otp" && (
            <DevOnly>
              <DevOtpPanel code={devCode} onFill={handleDevAutoFill} />
            </DevOnly>
          )}
        </div>

        {/* footer */}
        <p className="text-center text-xs text-fog mt-6 leading-6">
          ورود به معنای پذیرش{" "}
          <a href="#" className="text-stone hover:text-ink transition-colors">
            قوانین
          </a>{" "}
          است.
        </p>
      </div>
    </main>
  );
}

// تبدیل عدد به فارسی
function toPersianNum(n: number): string {
  return n.toLocaleString("fa-IR");
}
