"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PlansPricing — نمایش پویای پلن‌ها با سوییچ ماهانه/سالانه و کد تخفیف (DECISION-040)
// قیمت‌ها از سرور می‌آیند؛ کد تخفیف از /api/plans/validate-discount اعتبارسنجی می‌شود.
// خرید واقعی نیست (درگاه پرداخت ندارد) — دکمه در حالت «به‌زودی».
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";

export interface PublicFeature {
  text: string;
  /** متن مقدار برای امکانات عددی (مثل «۵۰ پیام در روز»)؛ null برای امکان ساده */
  quota: string | null;
  comingSoon: boolean;
  disabled: boolean;
}

export interface PublicPlan {
  key: string;
  label: string;
  description: string;
  highlight: boolean;
  isCurrent: boolean;
  monthlyPrice: number;
  annualPrice: number;
  features: PublicFeature[];
}

type Cycle = "monthly" | "annual";
interface DiscountResult {
  ok: boolean;
  discount?: number;
  finalPrice?: number;
  reason?: string;
}

const faNum = (n: number) => n.toLocaleString("fa-IR");

export function PlansPricing({ plans, isLoggedIn }: { plans: PublicPlan[]; isLoggedIn: boolean }) {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Record<string, DiscountResult> | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function applyCode() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/plans/validate-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c, cycle }),
      });
      const d = await res.json();
      if (!d.ok) {
        setResults(null); setAppliedCode(null);
        setMsg({ tone: "err", text: d.reason ?? "کد نامعتبر است." });
        return;
      }
      setResults(d.results);
      setAppliedCode(d.code);
      const anyApplies = Object.values(d.results as Record<string, DiscountResult>).some((r) => r.ok);
      setMsg(anyApplies
        ? { tone: "ok", text: `کد «${d.code}» اعمال شد.` }
        : { tone: "err", text: "این کد برای هیچ پلنِ این دوره معتبر نیست." });
    } catch {
      setMsg({ tone: "err", text: "اتصال برقرار نشد." });
    } finally { setBusy(false); }
  }

  function clearCode() {
    setCode(""); setResults(null); setAppliedCode(null); setMsg(null);
  }

  // با تغییر دوره، تخفیف اعمال‌شده باید دوباره اعتبارسنجی شود (قیمت‌ها فرق می‌کنند)
  function changeCycle(next: Cycle) {
    setCycle(next);
    if (appliedCode) { setResults(null); setAppliedCode(null); setMsg({ tone: "err", text: "دوره عوض شد — کد را دوباره اعمال کن." }); }
  }

  return (
    <div className="space-y-8">
      {/* سوییچ دوره + کد تخفیف */}
      <div className="flex flex-col items-center gap-4">
        <div className="inline-flex rounded-xl border border-black/8 bg-white/40 p-1">
          <CycleBtn active={cycle === "monthly"} onClick={() => changeCycle("monthly")}>ماهانه</CycleBtn>
          <CycleBtn active={cycle === "annual"} onClick={() => changeCycle("annual")}>سالانه</CycleBtn>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") void applyCode(); }}
            placeholder="کد تخفیف"
            dir="ltr"
            className="w-40 rounded-xl px-3 py-2 text-sm bg-white/70 border border-bone text-ink text-center focus:outline-none focus:border-sage num-latin"
          />
          {appliedCode ? (
            <button onClick={clearCode} className="text-xs px-3 py-2 rounded-xl text-stone hover:bg-black/5">حذف کد</button>
          ) : (
            <button onClick={applyCode} disabled={busy || !code.trim()} className="text-xs px-3 py-2 rounded-xl bg-ink text-paper hover:bg-charcoal transition-colors disabled:opacity-40">
              {busy ? "…" : "اعمال"}
            </button>
          )}
        </div>
        {msg && <p className={`text-xs ${msg.tone === "ok" ? "text-sage-deep" : "text-ember"}`}>{msg.text}</p>}
      </div>

      {/* کارت‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {plans.map((p) => (
          <PlanCard
            key={p.key}
            plan={p}
            cycle={cycle}
            isLoggedIn={isLoggedIn}
            discount={results?.[p.key]?.ok ? results[p.key] : undefined}
          />
        ))}
      </div>

      <p className="text-center text-xs text-fog/60">
        پرداخت آنلاین در نسخه‌های بعدی همسو فعال می‌شود.
      </p>
    </div>
  );
}

function CycleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${active ? "bg-ink text-paper" : "text-stone hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

function PlanCard({ plan, cycle, isLoggedIn, discount }: {
  plan: PublicPlan; cycle: Cycle; isLoggedIn: boolean; discount?: DiscountResult;
}) {
  const isPaid = plan.key !== "FREE";
  const basePrice = cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const annualMonthly = plan.annualPrice > 0 ? Math.round(plan.annualPrice / 12) : 0;

  return (
    <div className={`rounded-2xl border p-6 flex flex-col gap-5 ${
      plan.isCurrent ? "border-black/20 bg-white/60" : plan.highlight ? "border-ember/25 bg-ember/5 shadow-sm" : "border-black/8 bg-white/30"
    }`}>
      {/* هدر */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">{plan.label}</span>
          <div className="flex items-center gap-1.5">
            {plan.highlight && !plan.isCurrent && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-ember/12 text-ember font-medium">پیشنهادی</span>
            )}
            {plan.isCurrent && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage/15 text-sage-deep font-medium">پلن فعلی</span>
            )}
          </div>
        </div>
        {plan.description && <p className="text-[11px] text-fog leading-relaxed">{plan.description}</p>}

        {/* قیمت */}
        <PriceBlock isPaid={isPaid} basePrice={basePrice} cycle={cycle} annualMonthly={annualMonthly} discount={discount} />
      </div>

      {/* دکمه */}
      {plan.isCurrent ? (
        <div className="py-2.5 px-4 text-center text-sm text-fog border border-black/8 rounded-xl">پلن فعلی</div>
      ) : !isLoggedIn && !isPaid ? (
        <Link href="/login" className="py-2.5 px-4 text-center text-sm font-medium text-paper bg-ink rounded-xl hover:opacity-80 transition-opacity">
          شروع رایگان
        </Link>
      ) : (
        <div className="py-2.5 px-4 text-center text-sm text-fog/50 border border-black/5 rounded-xl cursor-default select-none">به‌زودی</div>
      )}

      <div className="h-px bg-black/6" />

      {/* ویژگی‌ها (شامل قابلیت‌های کاتالوگ + سفارشی — همگی با همان منطق فلگ) */}
      <ul className="space-y-3.5">
        {plan.features.map((f, i) => <FeatureRow key={i} feature={f} />)}
      </ul>
    </div>
  );
}

function PriceBlock({ isPaid, basePrice, cycle, annualMonthly, discount }: {
  isPaid: boolean; basePrice: number; cycle: Cycle; annualMonthly: number; discount?: DiscountResult;
}) {
  if (!isPaid) {
    return <div><span className="text-2xl font-bold text-ink">رایگان</span><span className="text-xs text-fog mr-1.5">برای همیشه</span></div>;
  }
  if (basePrice <= 0) {
    return <div><span className="text-2xl font-bold text-ink">به‌زودی</span><span className="text-xs text-fog mr-1.5">{cycle === "annual" ? "سالانه" : "ماهانه"}</span></div>;
  }
  const hasDiscount = discount?.ok && discount.finalPrice !== undefined;
  return (
    <div>
      <div className="flex items-baseline gap-2">
        {hasDiscount ? (
          <>
            <span className="text-2xl font-bold text-ink fa-num">{faNum(discount!.finalPrice!)}</span>
            <span className="text-sm text-fog/60 line-through fa-num">{faNum(basePrice)}</span>
          </>
        ) : (
          <span className="text-2xl font-bold text-ink fa-num">{faNum(basePrice)}</span>
        )}
        <span className="text-xs text-fog">تومان / {cycle === "annual" ? "سالانه" : "ماهانه"}</span>
      </div>
      {cycle === "annual" && annualMonthly > 0 && (
        <p className="text-[11px] text-fog mt-1 fa-num">معادل ماهانه: {faNum(annualMonthly)} تومان</p>
      )}
      {hasDiscount && discount!.discount! > 0 && (
        <p className="text-[11px] text-sage-deep mt-1 fa-num">{faNum(discount!.discount!)} تومان تخفیف</p>
      )}
    </div>
  );
}

function FeatureRow({ feature }: { feature: PublicFeature }) {
  // غیرفعال → خط روی متن (با آیکون خط تیره)
  if (feature.disabled) {
    return (
      <li className="flex items-start gap-2.5">
        <span className="w-4 h-4 shrink-0 flex items-center justify-center text-fog/30 mt-0.5">
          <svg width="10" height="2" viewBox="0 0 10 2" fill="none" aria-hidden><rect width="10" height="2" rx="1" fill="currentColor" /></svg>
        </span>
        <div className="min-w-0">
          <span className="text-sm text-fog/40 line-through">{feature.text}</span>
          {feature.quota && <span className="text-[11px] text-fog/40 line-through mr-1">({feature.quota})</span>}
        </div>
      </li>
    );
  }
  // به‌زودی → خاکستری + نشان «به‌زودی»
  const tone = feature.comingSoon ? "text-fog" : "text-stone";
  return (
    <li className="flex items-start gap-2.5">
      <CheckIcon className={`mt-0.5 ${feature.comingSoon ? "opacity-40" : ""}`} />
      <div className="min-w-0">
        <div className={`text-sm ${tone}`}>
          {feature.text}
          {feature.comingSoon && <span className="text-[9px] mr-1.5 px-1 py-0.5 rounded-full bg-mist/20 text-fog align-middle">به‌زودی</span>}
        </div>
        {feature.quota && <div className={`text-[11px] mt-0.5 ${feature.comingSoon ? "text-fog/60" : "text-fog"}`}>{feature.quota}</div>}
      </div>
    </li>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`w-4 h-4 shrink-0 flex items-center justify-center text-ember ${className}`}>
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
        <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
