"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PricingPublicView — نمایشِ عمومیِ پلن‌ها (بدون خرید)
//
// سه بخش:
//   ۱) کارت‌ها با سوییچ ماهانه/سالانه + نشانِ درصد صرفه‌جویی
//   ۲) جدولِ مقایسهٔ کاملِ امکانات (ردیف‌محور)
//   ۳) سوالاتِ متداول (FAQ)
//
// هیچ دکمهٔ خرید وجود ندارد. CTA پایینِ صفحه به /login می‌رود.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import type { PublicPlan } from "./PlansPricing";

type Cycle = "monthly" | "annual";

const faNum = (n: number) => n.toLocaleString("fa-IR");

// ── امکاناتِ پایه (مشترک همه پلن‌ها) ─────────────────────────────────────
const BASE_FEATURES = [
  "تعهد روزانه",
  "بازخورد روزانه",
  "تاریخچهٔ کامل",
  "گزارش هفتگی (خلاصه + نکات)",
];

// ── جدولِ مقایسهٔ کامل ────────────────────────────────────────────────────
interface CompareRow {
  label: string;
  free: string | boolean;
  plus: string | boolean;
  pro: string | boolean;
  comingSoon?: boolean;
}

const COMPARE_ROWS: CompareRow[] = [
  // پایه — همه پلن‌ها
  { label: "تعهد روزانه", free: true, plus: true, pro: true },
  { label: "بازخورد روزانه", free: true, plus: true, pro: true },
  { label: "تاریخچهٔ کامل", free: true, plus: true, pro: true },
  { label: "گزارش هفتگی (خلاصه + نکات)", free: true, plus: true, pro: true },
  { label: "برنامه‌ریزیِ هدف و استوریِ روزانه", free: true, plus: true, pro: true },
  { label: "همدمِ چت (پیام روزانه)", free: "۱۰ پیام", plus: "۲۰ پیام", pro: "۳۰ پیام" },
  { label: "شبکهٔ اجتماعیِ همسو", free: true, plus: true, pro: true, comingSoon: true },
  // Plus+Pro
  { label: "تب «تأمل» در گزارشِ هفتگی", free: false, plus: true, pro: true },
  { label: "پشتیبانیِ تیکتینگ", free: false, plus: true, pro: true },
  // فقط Pro
  { label: "همراهِ AI — کوچِ هدف", free: false, plus: false, pro: true },
  { label: "چتِ آنلاینِ پشتیبانی", free: false, plus: false, pro: true },
];

// ── سوالاتِ متداول ────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "آیا می‌توانم پلن را ارتقا دهم؟",
    a: "بله. هر زمان می‌توانید از داخل اپلیکیشن به پلن بالاتر ارتقا دهید. مابقیِ دورهٔ فعلی به صورت اعتبار در کیف‌پولتان لحاظ می‌شود.",
  },
  {
    q: "اگر اشتراکم را لغو کنم چه اتفاقی می‌افتد؟",
    a: "تا پایانِ دوره‌ای که پرداخت کرده‌اید، به امکاناتِ پلن دسترسی دارید. پس از آن پلن به رایگان برمی‌گردد و داده‌هایتان حفظ می‌شود.",
  },
  {
    q: "تفاوتِ «همدم» و «همراه» چیست؟",
    a: "همدم یک چتِ روزانهٔ همراهِ شماست — برای بیانِ احساس، پردازشِ تجربه، یا صحبت دربارهٔ روز. همراه یک کوچِ هدف‌محور است که روی مسیرِ هدفِ بازه‌ایِ شما تمرکز دارد و پیشنهادِ راهنماییِ روزانه می‌دهد.",
  },
  {
    q: "آیا اطلاعاتم با دیگران به اشتراک گذاشته می‌شود؟",
    a: "هرگز. تعهدها، بازخوردها و گزارش‌هایتان کاملاً خصوصی است. فقط در صورت انتخابِ شخصیِ شما، خروجیِ گزارش را می‌توانید با دیگران به اشتراک بگذارید.",
  },
  {
    q: "پلنِ رایگان واقعاً رایگان است؟",
    a: "بله، برای همیشه. محدودیتِ زمانی ندارد. برای شروعِ مسیر و تثبیتِ عادتِ خودبازبینی کاملاً کافی است.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export function PricingPublicView({ plans }: { plans: PublicPlan[] }) {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  // درصد صرفه‌جویی سالانه برای نشان toggle
  const savingPercent = (() => {
    const plus = plans.find((p) => p.key === "PLUS");
    if (!plus || !plus.monthlyPrice || !plus.annualPrice) return null;
    const monthly12 = plus.monthlyPrice * 12;
    const saving = Math.round(((monthly12 - plus.annualPrice) / monthly12) * 100);
    return saving > 0 ? saving : null;
  })();

  return (
    <div className="space-y-16">

      {/* ── ۱) سوییچ دوره ── */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-xl border border-black/8 bg-white/40 p-1">
          <CycleBtn active={cycle === "monthly"} onClick={() => setCycle("monthly")}>ماهانه</CycleBtn>
          <CycleBtn active={cycle === "annual"} onClick={() => setCycle("annual")}>
            <span>سالانه</span>
            {savingPercent && (
              <span className={`mr-1.5 text-[10px] px-1.5 py-0.5 rounded-full transition-all ${
                cycle === "annual" ? "bg-sage/20 text-sage-deep" : "bg-ember/10 text-ember"
              }`}>
                {faNum(savingPercent)}٪ صرفه‌جویی
              </span>
            )}
          </CycleBtn>
        </div>
      </div>

      {/* ── ۲) کارت‌ها ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {plans.map((plan) => (
          <PricingCard key={plan.key} plan={plan} cycle={cycle} />
        ))}
      </div>

      {/* ── CTA میانی ── */}
      <div className="text-center py-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
        >
          شروع رایگان — بدون نیاز به کارت
        </Link>
        <p className="text-xs text-fog mt-3">
          پلنِ رایگان برای همیشه در دسترس است. ارتقا هر وقت خواستید.
        </p>
      </div>

      {/* ── ۳) جدولِ مقایسهٔ کامل ── */}
      <ComparisonTable plans={plans} />

      {/* ── ۴) سوالاتِ متداول ── */}
      <FaqSection />

    </div>
  );
}

// ─── کارتِ پلن ────────────────────────────────────────────────────────────

function PricingCard({ plan, cycle }: { plan: PublicPlan; cycle: Cycle }) {
  const basePrice = cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const annualMonthly = plan.annualPrice > 0 ? Math.round(plan.annualPrice / 12) : 0;
  const isPaid = plan.key !== "FREE";

  // فقط ۴ امکانِ پایه + امکاناتِ پلن‌خاص (بدون تکرار BASE_FEATURES)
  const topFeatures = plan.features.slice(0, 6);

  return (
    <div className={`rounded-2xl border p-6 flex flex-col gap-4 ${
      plan.highlight
        ? "border-ember/30 bg-ember/4 shadow-sm ring-1 ring-ember/10"
        : "border-black/8 bg-white/30"
    }`}>
      {/* هدر */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">{plan.label}</span>
          {plan.highlight && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-ember/12 text-ember font-medium">پیشنهادی</span>
          )}
        </div>
        {plan.description && (
          <p className="text-[11px] text-fog leading-relaxed">{plan.description}</p>
        )}

        {/* قیمت */}
        {!isPaid ? (
          <div>
            <span className="text-2xl font-bold text-ink">رایگان</span>
            <span className="text-xs text-fog mr-2">برای همیشه</span>
          </div>
        ) : basePrice <= 0 ? (
          <div>
            <span className="text-2xl font-bold text-ink">به‌زودی</span>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink fa-num">{faNum(basePrice)}</span>
              <span className="text-xs text-fog">تومان / {cycle === "annual" ? "سالانه" : "ماهانه"}</span>
            </div>
            {cycle === "annual" && annualMonthly > 0 && (
              <p className="text-[11px] text-fog mt-0.5 fa-num">
                معادلِ ماهانه: {faNum(annualMonthly)} تومان
              </p>
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-black/6" />

      {/* امکانات */}
      <ul className="space-y-3">
        {topFeatures.map((f, i) => <FeatureItem key={i} feature={f} />)}
      </ul>
    </div>
  );
}

function FeatureItem({ feature }: { feature: PublicPlan["features"][number] }) {
  if (feature.disabled) {
    return (
      <li className="flex items-start gap-2">
        <span className="w-4 h-4 shrink-0 flex items-center justify-center text-fog/30 mt-0.5">
          <svg width="10" height="2" viewBox="0 0 10 2" fill="none" aria-hidden><rect width="10" height="2" rx="1" fill="currentColor" /></svg>
        </span>
        <span className="text-sm text-fog/40 line-through">{feature.text}</span>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2">
      <CheckIcon className={feature.comingSoon ? "opacity-40" : ""} />
      <div>
        <span className={`text-sm ${feature.comingSoon ? "text-fog" : "text-stone"}`}>
          {feature.text}
          {feature.comingSoon && (
            <span className="text-[9px] mr-1.5 px-1 py-0.5 rounded-full bg-mist/20 text-fog align-middle">به‌زودی</span>
          )}
        </span>
        {feature.quota && (
          <div className="text-[11px] text-fog mt-0.5">{feature.quota}</div>
        )}
      </div>
    </li>
  );
}

// ─── جدولِ مقایسه ────────────────────────────────────────────────────────

function ComparisonTable({ plans }: { plans: PublicPlan[] }) {
  const planLabels = plans.map((p) => p.label);

  return (
    <div>
      <h2 className="text-base font-semibold text-ink text-center mb-6">مقایسهٔ کاملِ امکانات</h2>
      <div className="overflow-x-auto rounded-2xl border border-black/8">
        <table className="w-full text-sm" style={{ direction: "rtl" }}>
          <thead>
            <tr className="border-b border-black/6">
              <th className="text-right px-4 py-3.5 text-xs text-fog font-medium w-1/2">امکانات</th>
              {plans.map((p) => (
                <th key={p.key} className={`px-4 py-3.5 text-center text-xs font-semibold ${p.highlight ? "text-ember" : "text-ink"}`}>
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row, i) => (
              <tr key={i} className={`border-b border-black/4 last:border-b-0 ${i % 2 === 0 ? "bg-black/[0.012]" : ""}`}>
                <td className="px-4 py-3 text-stone">
                  {row.label}
                  {row.comingSoon && (
                    <span className="text-[9px] mr-1.5 px-1 py-0.5 rounded-full bg-mist/20 text-fog align-middle">به‌زودی</span>
                  )}
                </td>
                {(["free", "plus", "pro"] as const).slice(0, planLabels.length).map((key) => (
                  <td key={key} className="px-4 py-3 text-center">
                    <CellValue value={row[key]} comingSoon={row.comingSoon} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellValue({ value, comingSoon }: { value: string | boolean; comingSoon?: boolean }) {
  if (comingSoon) {
    return <span className="text-[10px] text-fog/60 italic">به‌زودی</span>;
  }
  if (typeof value === "string") {
    return <span className="text-xs text-stone fa-num">{value}</span>;
  }
  if (value) {
    return (
      <span className="inline-flex items-center justify-center text-sage-deep">
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
          <path d="M1.5 5.5l3.5 4L12.5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center text-fog/30">
      <svg width="10" height="2" viewBox="0 0 10 2" fill="none" aria-hidden>
        <rect width="10" height="2" rx="1" fill="currentColor" />
      </svg>
    </span>
  );
}

// ─── سوالاتِ متداول ───────────────────────────────────────────────────────

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      <h2 className="text-base font-semibold text-ink text-center mb-6">سوالاتِ متداول</h2>
      <div className="max-w-2xl mx-auto space-y-2">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className="rounded-xl border border-black/8 overflow-hidden bg-white/30"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-right text-sm font-medium text-ink hover:bg-black/3 transition-colors"
            >
              <span>{faq.q}</span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                className={`shrink-0 mr-3 transition-transform duration-300 text-fog ${open === i ? "rotate-180" : ""}`}
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-stone leading-loose border-t border-black/5">
                <div className="pt-3">{faq.a}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── کامپوننت‌های کمکی ────────────────────────────────────────────────────

function CycleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-4 py-1.5 rounded-lg text-sm transition-colors ${
        active ? "bg-ink text-paper" : "text-stone hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`w-4 h-4 shrink-0 flex items-center justify-center text-ember mt-0.5 ${className}`}>
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
        <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
