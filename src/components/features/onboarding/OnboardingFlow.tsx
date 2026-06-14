"use client";

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingFlow — سفرِ رواییِ تمام‌صفحه برای کاربرِ تازه‌وارد (DECISION-085)
//
// چهار پرده، با گذارِ نرم و آرام (بنچ‌مارک: Headspace/Calm):
//   ۰. روایت     — همسو چیست (لحنِ مانیفست، بدون فشار/قضاوت)
//   ۱. نام تو     — displayName
//   ۲. نام همدم   — companionName (پیش‌فرضِ ادمین)
//   ۳. اولین قدم  — هدایت به اولین تعهد
//
// اصول: سکوت بصری، بدون گیمیفیکیشن، قابلِ رد شدن در هر پرده (بی‌فشار).
// قانون متنِ دکمه (DECISION-053): متنِ دکمه ثابت می‌ماند؛ حین کار فقط Spinner.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";

const TOTAL_STEPS = 4;
const MAX_NAME = 50;
const MAX_COMPANION = 30;

interface Props {
  initialDisplayName: string;
  initialCompanionName: string;
  defaultCompanionName: string;
}

export function OnboardingFlow({
  initialDisplayName,
  initialCompanionName,
  defaultCompanionName,
}: Props) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [companionName, setCompanionName] = useState(
    initialCompanionName || defaultCompanionName
  );
  const [saving, setSaving] = useState(false);

  function next() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }

  // پایانِ سفر — ذخیرهٔ نام‌ها + onboardedAt، سپس هدایت به اولین تعهد.
  // skip=true یعنی کاربر رد کرده؛ باز هم onboardedAt ست می‌شود تا دوباره دیده نشود.
  async function finish(skip = false) {
    if (saving) return;
    setSaving(true);
    try {
      const payload: { displayName?: string; companionName?: string } = {};
      if (!skip) {
        if (displayName.trim()) payload.displayName = displayName.trim();
        if (companionName.trim()) payload.companionName = companionName.trim();
      }
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "مشکلی پیش آمد — دوباره تلاش کن");
        setSaving(false);
        return;
      }
      // نشانهٔ یک‌بارهٔ راهنماییِ اولین تعهد در داشبورد
      try {
        sessionStorage.setItem("hamsoo_welcome_hint", "1");
      } catch {
        /* بی‌اهمیت */
      }
      // reload کامل تا layout نامِ تازه را برای ChatFAB/همدم بخواند
      window.location.href = "/dashboard";
    } catch {
      toast.error("اتصال برقرار نشد");
      setSaving(false);
    }
  }

  return (
    <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center animate-fade-up">
      {/* لوگو */}
      <div className="mb-10">
        <Image src="/logo.png" alt="همسو" width={44} height={44} className="opacity-90" priority />
      </div>

      {/* پرده‌ها — هر پرده با کلیدِ مجزا fade می‌شود */}
      <div key={step} className="w-full animate-fade-in min-h-64 flex flex-col items-center justify-center">
        {step === 0 && <StepIntro onNext={next} />}
        {step === 1 && (
          <StepName
            value={displayName}
            onChange={setDisplayName}
            onNext={next}
          />
        )}
        {step === 2 && (
          <StepCompanion
            value={companionName}
            onChange={setCompanionName}
            onNext={next}
          />
        )}
        {step === 3 && (
          <StepFirst saving={saving} onFinish={() => finish(false)} displayName={displayName} />
        )}
      </div>

      {/* نقطه‌های پیشرفت */}
      <div className="mt-10 flex items-center justify-center gap-2" aria-hidden>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === step ? 18 : 6,
              background: i === step ? "var(--color-ink)" : "var(--color-fog)",
              opacity: i === step ? 1 : 0.45,
            }}
          />
        ))}
      </div>

      {/* رد شدن — آرام، بی‌فشار، در همهٔ پرده‌ها جز پایانی */}
      {step < TOTAL_STEPS - 1 && (
        <button
          type="button"
          onClick={() => finish(true)}
          disabled={saving}
          className="mt-5 text-xs text-fog hover:text-stone transition-colors disabled:opacity-40"
        >
          رد شدن
        </button>
      )}
    </div>
  );
}

// ─── پردهٔ ۰: روایت ──────────────────────────────────────────────────────────
function StepIntro({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-7">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">به همسو خوش آمدی</h1>
        <div className="space-y-2 text-sm text-stone leading-loose max-w-xs">
          <p>هر روز، یک تعهدِ کوچک به خودت.</p>
          <p>فردا، یک بازخوردِ صادق.</p>
          <p>در پایانِ هفته، نگاهی عمیق به مسیرت.</p>
        </div>
        <p className="text-xs text-fog pt-1">بدون فشار. بدون قضاوت. فقط تو و مسیرت.</p>
      </div>
      <PrimaryButton onClick={onNext}>بزن بریم</PrimaryButton>
    </div>
  );
}

// ─── پردهٔ ۱: نام تو ─────────────────────────────────────────────────────────
function StepName({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-7 w-full">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">تو را چه صدا کنیم؟</h2>
        <p className="text-xs text-stone leading-relaxed max-w-xs">
          اسمی که دوست داری در همسو با آن خطابت کنیم.
        </p>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_NAME))}
        onKeyDown={(e) => e.key === "Enter" && onNext()}
        dir="rtl"
        autoFocus
        placeholder="مثلاً: بهرام"
        className="w-full max-w-xs rounded-xl px-4 py-3 text-center text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
      />
      <PrimaryButton onClick={onNext}>ادامه</PrimaryButton>
    </div>
  );
}

// ─── پردهٔ ۲: نام همدم ───────────────────────────────────────────────────────
function StepCompanion({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-7 w-full">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">همراهت چه نامی داشته باشد؟</h2>
        <p className="text-xs text-stone leading-relaxed max-w-xs">
          «همدم» همراهِ همدلِ توست — هر وقت خواستی کنارت است. می‌توانی نامش را عوض کنی.
        </p>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_COMPANION))}
        onKeyDown={(e) => e.key === "Enter" && onNext()}
        dir="rtl"
        autoFocus
        placeholder="همدم"
        className="w-full max-w-xs rounded-xl px-4 py-3 text-center text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
      />
      <PrimaryButton onClick={onNext}>ادامه</PrimaryButton>
    </div>
  );
}

// ─── پردهٔ ۳: اولین قدم ──────────────────────────────────────────────────────
function StepFirst({
  saving,
  onFinish,
  displayName,
}: {
  saving: boolean;
  onFinish: () => void;
  displayName: string;
}) {
  const who = displayName.trim() ? `${displayName.trim()}، ` : "";
  return (
    <div className="flex flex-col items-center gap-7">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">حالا، اولین قدم</h2>
        <p className="text-sm text-stone leading-loose max-w-xs">
          {who}آماده‌ای؟ یک تعهدِ کوچک و واقعی برای امروزت بنویس — همین‌جا مسیرت شروع می‌شود.
        </p>
      </div>
      <PrimaryButton onClick={onFinish} loading={saving}>
        اولین تعهدم را بنویسم
      </PrimaryButton>
    </div>
  );
}

// ─── دکمهٔ اصلی ──────────────────────────────────────────────────────────────
function PrimaryButton({
  children,
  onClick,
  loading = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
    >
      {loading && <Spinner size={14} className="text-paper" />}
      {children}
    </button>
  );
}
