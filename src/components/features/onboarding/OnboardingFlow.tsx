"use client";

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingFlow — رندرِ سفرِ خوش‌آمدگویی از پیکربندیِ مدیریت‌شده (DECISION-089)
//
// اسلایدها از /admin/settings می‌آیند (getOnboardingConfig). این کامپوننت فقط
// آن‌ها را رندر می‌کند — هیچ اسلایدِ هاردکدی نیست. انواع: narrative | name | motive | final.
// اسلایدِ همدم حذف شده (نامِ همدم admin-controlled است — DECISION-089).
//
// طراحیِ سبکِ Notion: پس‌زمینهٔ تمیز، پرده‌های تک‌تمرکز، گذارِ نرم، قابلِ رد شدن.
// قانون متنِ دکمه (DECISION-053): متنِ دکمه ثابت؛ حین کار فقط Spinner.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import type { OnboardingSlide } from "@/lib/onboarding/config";

const MAX_NAME = 50;

interface Props {
  slides: OnboardingSlide[];
  initialDisplayName: string;
  initialMotive: string;
}

export function OnboardingFlow({ slides, initialDisplayName, initialMotive }: Props) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [motive, setMotive] = useState(initialMotive);
  const [saving, setSaving] = useState(false);

  const total = slides.length;
  const current = slides[step];
  const isLast = step >= total - 1;

  function next() {
    if (step < total - 1) setStep((s) => s + 1);
  }

  // پایانِ سفر — ذخیرهٔ نام/انگیزه + onboardedAt، سپس هدایت به اولین تعهد.
  // skip=true یعنی کاربر رد کرده؛ باز هم onboardedAt ست می‌شود تا دوباره دیده نشود.
  async function finish(skip = false) {
    if (saving) return;
    setSaving(true);
    try {
      const payload: { displayName?: string; motive?: string } = {};
      if (!skip) {
        if (displayName.trim()) payload.displayName = displayName.trim();
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
      try {
        sessionStorage.setItem("hamsoo_welcome_hint", "1");
      } catch {
        /* بی‌اهمیت */
      }
      // reload کامل تا layout نامِ تازه را بخواند
      window.location.href = "/dashboard";
    } catch {
      toast.error("اتصال برقرار نشد");
      setSaving(false);
    }
  }

  if (!current) return null;

  return (
    <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center animate-fade-up">
      {/* لوگو */}
      <div className="mb-10">
        <Image src="/logo.png" alt="همسو" width={44} height={44} className="opacity-90" priority />
      </div>

      {/* پردهٔ جاری — با کلیدِ مجزا fade می‌شود */}
      <div key={step} className="w-full animate-fade-in min-h-64 flex flex-col items-center justify-center">
        {current.type === "narrative" && <NarrativeStep slide={current} onNext={next} />}
        {current.type === "name" && (
          <NameStep slide={current} value={displayName} onChange={setDisplayName} onNext={next} />
        )}
        {current.type === "motive" && (
          <MotiveStep slide={current} value={motive} onChange={setMotive} onNext={next} />
        )}
        {current.type === "final" && (
          <FinalStep slide={current} saving={saving} displayName={displayName} onFinish={() => finish(false)} />
        )}
      </div>

      {/* نقطه‌های پیشرفت */}
      {total > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2" aria-hidden>
          {slides.map((_, i) => (
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
      )}

      {/* رد شدن — آرام، بی‌فشار، در همهٔ پرده‌ها جز پایانی */}
      {!isLast && (
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

// ─── متن چندخطی → پاراگراف‌ها ─────────────────────────────────────────────────
function BodyLines({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="space-y-2 text-sm text-stone leading-loose max-w-xs">
      {lines.map((l, i) => (
        <p key={i}>{l}</p>
      ))}
    </div>
  );
}

// ─── پردهٔ روایی ──────────────────────────────────────────────────────────────
function NarrativeStep({
  slide,
  onNext,
}: {
  slide: { title: string; body: string; footnote: string; buttonText: string };
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-7">
      <div className="space-y-3">
        {slide.title && <h1 className="text-2xl font-semibold text-ink tracking-tight">{slide.title}</h1>}
        {slide.body && <BodyLines text={slide.body} />}
        {slide.footnote && <p className="text-xs text-fog pt-1">{slide.footnote}</p>}
      </div>
      <PrimaryButton onClick={onNext}>{slide.buttonText || "ادامه"}</PrimaryButton>
    </div>
  );
}

// ─── پردهٔ نام ────────────────────────────────────────────────────────────────
function NameStep({
  slide,
  value,
  onChange,
  onNext,
}: {
  slide: { title: string; subtitle: string; placeholder: string; buttonText: string };
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-7 w-full">
      <div className="space-y-2">
        {slide.title && <h2 className="text-xl font-semibold text-ink">{slide.title}</h2>}
        {slide.subtitle && <p className="text-xs text-stone leading-relaxed max-w-xs">{slide.subtitle}</p>}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_NAME))}
        onKeyDown={(e) => e.key === "Enter" && onNext()}
        dir="rtl"
        autoFocus
        placeholder={slide.placeholder}
        className="w-full max-w-xs rounded-xl px-4 py-3 text-center text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
      />
      <PrimaryButton onClick={onNext}>{slide.buttonText || "ادامه"}</PrimaryButton>
    </div>
  );
}

// ─── پردهٔ انگیزه ─────────────────────────────────────────────────────────────
function MotiveStep({
  slide,
  value,
  onChange,
  onNext,
}: {
  slide: { title: string; subtitle: string; options: { slug: string; label: string }[]; buttonText: string };
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-7 w-full">
      <div className="space-y-2">
        {slide.title && <h2 className="text-xl font-semibold text-ink">{slide.title}</h2>}
        {slide.subtitle && <p className="text-xs text-stone leading-relaxed max-w-xs">{slide.subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
        {slide.options.map((m) => {
          const on = value === m.slug;
          return (
            <button
              key={m.slug}
              type="button"
              onClick={() => onChange(on ? "" : m.slug)}
              aria-pressed={on}
              className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                on ? "bg-ink text-paper border-ink" : "bg-white/60 text-stone border-bone hover:border-sage"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <PrimaryButton onClick={onNext}>{slide.buttonText || "ادامه"}</PrimaryButton>
    </div>
  );
}

// ─── پردهٔ پایان ──────────────────────────────────────────────────────────────
function FinalStep({
  slide,
  saving,
  displayName,
  onFinish,
}: {
  slide: { title: string; body: string; footnote: string; buttonText: string };
  saving: boolean;
  displayName: string;
  onFinish: () => void;
}) {
  // {name} → «نامِ کاربر، » یا حذفِ نرم
  const who = displayName.trim() ? `${displayName.trim()}، ` : "";
  const body = slide.body.replace(/\{name\}/g, who);
  return (
    <div className="flex flex-col items-center gap-7">
      <div className="space-y-3">
        {slide.title && <h2 className="text-xl font-semibold text-ink">{slide.title}</h2>}
        {body && <p className="text-sm text-stone leading-loose max-w-xs">{body}</p>}
        {slide.footnote && <p className="text-xs text-fog">{slide.footnote}</p>}
      </div>
      <PrimaryButton onClick={onFinish} loading={saving}>
        {slide.buttonText || "بزن بریم"}
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
