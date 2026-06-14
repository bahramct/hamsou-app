"use client";

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingFlow — سفرِ خوش‌آمدگوییِ کاربرِ تازه‌وارد (DECISION-085/088)
//
// طراحیِ سبکِ Notion: پنج پردهٔ تک‌تمرکز، پس‌زمینهٔ تمیز، گذارِ نرم و سریع:
//   ۰. خوش‌آمد       — همسو چیست (لحنِ مانیفست، موجز)
//   ۱. پرسشِ شخصی‌ساز — «چه چیزی تو را به همسو آورد؟» (اختیاری؛ امضای Notion)
//   ۲. نام تو         — displayName
//   ۳. نام همدم       — companionName (پیش‌فرضِ ادمین)
//   ۴. اولین قدم      — هدایت به اولین تعهد (لحنِ متناسب با انگیزه)
//
// اصول: سکوت بصری، بدون گیمیفیکیشن، قابلِ رد شدن در هر پرده (بی‌فشار).
// قانون متنِ دکمه (DECISION-053): متنِ دکمه ثابت می‌ماند؛ حین کار فقط Spinner.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import { ONBOARDING_MOTIVES } from "@/lib/onboarding/motives";

const TOTAL_STEPS = 5;
const MAX_NAME = 50;
const MAX_COMPANION = 30;

interface Props {
  initialDisplayName: string;
  initialCompanionName: string;
  initialMotive: string;
  defaultCompanionName: string;
}

export function OnboardingFlow({
  initialDisplayName,
  initialCompanionName,
  initialMotive,
  defaultCompanionName,
}: Props) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [companionName, setCompanionName] = useState(
    initialCompanionName || defaultCompanionName
  );
  const [motive, setMotive] = useState(initialMotive);
  const [saving, setSaving] = useState(false);

  function next() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }

  // پایانِ سفر — ذخیرهٔ نام‌ها/انگیزه + onboardedAt، سپس هدایت به اولین تعهد.
  // skip=true یعنی کاربر رد کرده؛ باز هم onboardedAt ست می‌شود تا دوباره دیده نشود.
  async function finish(skip = false) {
    if (saving) return;
    setSaving(true);
    try {
      const payload: { displayName?: string; companionName?: string; motive?: string } = {};
      if (!skip) {
        if (displayName.trim()) payload.displayName = displayName.trim();
        if (companionName.trim()) payload.companionName = companionName.trim();
        if (motive) payload.motive = motive;
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
          <StepMotive value={motive} onChange={setMotive} onNext={next} />
        )}
        {step === 2 && (
          <StepName value={displayName} onChange={setDisplayName} onNext={next} />
        )}
        {step === 3 && (
          <StepCompanion value={companionName} onChange={setCompanionName} onNext={next} />
        )}
        {step === 4 && (
          <StepFirst saving={saving} onFinish={() => finish(false)} displayName={displayName} motive={motive} />
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

// ─── پردهٔ ۰: خوش‌آمد ─────────────────────────────────────────────────────────
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

// ─── پردهٔ ۱: پرسشِ شخصی‌ساز ──────────────────────────────────────────────────
function StepMotive({
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
        <h2 className="text-xl font-semibold text-ink">چه چیزی تو را به همسو آورد؟</h2>
        <p className="text-xs text-stone leading-relaxed max-w-xs">
          هر چه باشد، اینجا جای توست. این فقط کمک می‌کند مسیرت کمی شخصی‌تر شروع شود.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
        {ONBOARDING_MOTIVES.map((m) => {
          const on = value === m.slug;
          return (
            <button
              key={m.slug}
              type="button"
              onClick={() => onChange(on ? "" : m.slug)}
              aria-pressed={on}
              className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                on
                  ? "bg-ink text-paper border-ink"
                  : "bg-white/60 text-stone border-bone hover:border-sage"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <PrimaryButton onClick={onNext}>ادامه</PrimaryButton>
    </div>
  );
}

// ─── پردهٔ ۲: نام تو ─────────────────────────────────────────────────────────
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

// ─── پردهٔ ۳: نام همدم ───────────────────────────────────────────────────────
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

// ─── پردهٔ ۴: اولین قدم ──────────────────────────────────────────────────────
// لحنِ پایانی متناسب با انگیزهٔ انتخابی شخصی‌تر می‌شود (هم‌ترازی با پرسشِ پردهٔ ۱).
const MOTIVE_CLOSING: Record<string, string> = {
  "daily-rhythm": "امروز، اولین قدمِ کوچکِ نظم.",
  calm: "امروز، یک قدمِ آرام برای خودت.",
  "self-awareness": "امروز، یک قدم به سمتِ شناختِ خودت.",
  "specific-change": "امروز، اولین قدم به سمتِ آن تغییر.",
};

function StepFirst({
  saving,
  onFinish,
  displayName,
  motive,
}: {
  saving: boolean;
  onFinish: () => void;
  displayName: string;
  motive: string;
}) {
  const who = displayName.trim() ? `${displayName.trim()}، ` : "";
  const closing = MOTIVE_CLOSING[motive];
  return (
    <div className="flex flex-col items-center gap-7">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-ink">حالا، اولین قدم</h2>
        <p className="text-sm text-stone leading-loose max-w-xs">
          {who}آماده‌ای؟ یک تعهدِ کوچک و واقعی برای امروزت بنویس — همین‌جا مسیرت شروع می‌شود.
        </p>
        {closing && <p className="text-xs text-fog">{closing}</p>}
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
