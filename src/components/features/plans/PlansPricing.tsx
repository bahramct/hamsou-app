"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PlansPricing — نمایش پویای پلن‌ها با سوییچ ماهانه/سالانه و کد تخفیف (DECISION-040)
// قیمت‌ها از سرور می‌آیند؛ کد تخفیف از /api/plans/validate-discount اعتبارسنجی می‌شود.
// خرید با دو روش مستقل (DECISION-073): موجودی کیف‌پول یا پرداخت مستقیم از درگاه آنلاین.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

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

// رتبهٔ نمایشِ ویژگی برای مرتب‌سازی: فعال (تیک) → به‌زودی → غیرفعال (DECISION-087)
const featureRank = (f: PublicFeature) => (f.disabled ? 2 : f.comingSoon ? 1 : 0);

export function PlansPricing({
  plans, isLoggedIn, walletBalance = 0, currentPlanKey = "FREE", planDaysLeft = null,
  currentPlanBasePrice = 0,
}: {
  plans: PublicPlan[];
  isLoggedIn: boolean;
  walletBalance?: number;
  currentPlanKey?: string;
  planDaysLeft?: number | null;
  currentPlanBasePrice?: number;
}) {
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
            walletBalance={walletBalance}
            appliedCode={appliedCode}
            discount={results?.[p.key]?.ok ? results[p.key] : undefined}
            currentPlanKey={currentPlanKey}
            planDaysLeft={planDaysLeft}
            currentPlanBasePrice={currentPlanBasePrice}
          />
        ))}
      </div>

      {isLoggedIn && (
        <p className="text-center text-xs text-fog fa-num">
          موجودی کیف‌پول شما: {walletBalance.toLocaleString("fa-IR")} تومان ·{" "}
          <Link href="/settings/profile" className="text-ember hover:underline">شارژ از پروفایل</Link>
        </p>
      )}
      <p className="text-center text-xs text-fog/60">
        خرید با موجودی کیف‌پول یا پرداخت مستقیم از درگاه آنلاین — هر کدام که راحت‌تری.
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

function PlanCard({ plan, cycle, isLoggedIn, walletBalance, appliedCode, discount, currentPlanKey, planDaysLeft, currentPlanBasePrice }: {
  plan: PublicPlan; cycle: Cycle; isLoggedIn: boolean; walletBalance: number; appliedCode: string | null;
  discount?: DiscountResult; currentPlanKey: string; planDaysLeft: number | null; currentPlanBasePrice: number;
}) {
  const [showBuy, setShowBuy] = useState(false);
  const isPaid = plan.key !== "FREE";
  const basePrice = cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const annualMonthly = plan.annualPrice > 0 ? Math.round(plan.annualPrice / 12) : 0;
  const finalPrice = discount?.ok && discount.finalPrice !== undefined ? discount.finalPrice : basePrice;
  const priced = isPaid && basePrice > 0;

  // محافظت قیمتی (DECISION-076): اگر قیمت این پلن کمتر از پلن فعال کاربر باشد، خریدش
  // مجاز نیست. اما ساختارِ کارت هرگز تغییر نمی‌کند (DECISION-087) — فقط هنگامِ اکشن،
  // با toast اطلاع‌رسانی می‌شود (enforcement واقعی همچنان سمتِ سرور است).
  const currentPlanActive = planDaysLeft != null && planDaysLeft > 0;
  const isBlockedDowngrade = isLoggedIn && currentPlanActive && isPaid && currentPlanBasePrice > 0 && basePrice < currentPlanBasePrice;

  function handleBuyClick() {
    if (isBlockedDowngrade) {
      toast.info("پلنِ فعلیِ تو بالاتر است — پس از پایانِ دوره می‌توانی پلنِ پایین‌تر را انتخاب کنی.");
      return;
    }
    setShowBuy(true);
  }

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
        {/* زمانِ باقی‌مانده عمداً اینجا نمایش داده نمی‌شود — جای آن در پروفایل/کیف‌پول
            است، نه صفحهٔ مقایسهٔ پلن‌ها (DECISION-087). */}
        {plan.description && <p className="text-[11px] text-fog leading-relaxed">{plan.description}</p>}

        {/* قیمت */}
        <PriceBlock isPaid={isPaid} basePrice={basePrice} cycle={cycle} annualMonthly={annualMonthly} discount={discount} />
      </div>

      {/* دکمه */}
      {!isLoggedIn ? (
        isPaid ? (
          <Link href="/login" className="py-2.5 px-4 text-center text-sm font-medium text-paper bg-ink rounded-xl hover:opacity-80 transition-opacity">
            ورود برای خرید
          </Link>
        ) : (
          <Link href="/login" className="py-2.5 px-4 text-center text-sm font-medium text-paper bg-ink rounded-xl hover:opacity-80 transition-opacity">
            شروع رایگان
          </Link>
        )
      ) : !isPaid ? (
        plan.isCurrent ? (
          <div className="py-2.5 px-4 text-center text-sm text-fog border border-black/8 rounded-xl">پلن فعلی</div>
        ) : (
          <div className="py-2.5 px-4 text-center text-sm text-fog border border-black/8 rounded-xl">رایگان</div>
        )
      ) : !priced ? (
        <div className="py-2.5 px-4 text-center text-sm text-fog/50 border border-black/5 rounded-xl cursor-default select-none">به‌زودی</div>
      ) : (
        // ساختارِ کارت همیشه یکسان است؛ محدودیتِ downgrade فقط هنگامِ کلیک با toast اعلام می‌شود
        <button
          onClick={handleBuyClick}
          className="py-2.5 px-4 text-center text-sm font-medium text-paper bg-ink rounded-xl hover:bg-charcoal transition-colors"
        >
          {plan.isCurrent ? "تمدید پلن" : "خرید پلن"}
        </button>
      )}

      {showBuy && (
        <PurchaseModal
          planKey={plan.key}
          planLabel={plan.label}
          cycle={cycle}
          finalPrice={finalPrice}
          walletBalance={walletBalance}
          appliedCode={appliedCode}
          isRenew={plan.isCurrent}
          onClose={() => setShowBuy(false)}
        />
      )}

      <div className="h-px bg-black/6" />

      {/* ویژگی‌ها — مرتب‌شده تا تیک‌ها پشت‌سرهم از بالا باشند (DECISION-087):
          ابتدا فعال‌ها، سپس «به‌زودی»، در انتها غیرفعال‌ها (خط‌خورده). مرتب‌سازی پایدار. */}
      <ul className="space-y-3.5">
        {[...plan.features]
          .sort((a, b) => featureRank(a) - featureRank(b))
          .map((f, i) => <FeatureRow key={i} feature={f} />)}
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

// ─── مودال خرید پلن — کیف‌پول یا درگاه مستقیم (DECISION-062 → DECISION-073) ────
// دو روش مستقل: ① موجودی کیف‌پول (اگر کافی باشد) ② پرداخت مستقیم از درگاه آنلاین
// (بدون نیاز به شارژ قبلی). شارژ کیف‌پول و خرید پلن از هم جدا هستند.
function PurchaseModal({
  planKey, planLabel, cycle, finalPrice, walletBalance, appliedCode, isRenew, onClose,
}: {
  planKey: string; planLabel: string; cycle: Cycle; finalPrice: number;
  walletBalance: number; appliedCode: string | null; isRenew: boolean; onClose: () => void;
}) {
  const router = useRouter();
  const [busyWallet, setBusyWallet] = useState(false);
  const [busyGateway, setBusyGateway] = useState(false);
  const busy = busyWallet || busyGateway;
  const enough = walletBalance >= finalPrice;
  const shortBy = Math.max(0, finalPrice - walletBalance);

  async function buyWithWallet() {
    setBusyWallet(true);
    try {
      const res = await fetch("/api/wallet/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, cycle, code: appliedCode ?? undefined }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "خرید ناموفق بود."); return; }
      toast.success(isRenew ? "پلن تمدید شد" : "پلن فعال شد");
      router.refresh();
      onClose();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusyWallet(false); }
  }

  async function buyWithGateway() {
    setBusyGateway(true);
    try {
      const res = await fetch("/api/plans/checkout/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, cycle, code: appliedCode ?? undefined }),
      });
      const d = await res.json();
      if (!res.ok || !d?.startPayUrl) {
        toast.error(d?.error ?? "اتصال به درگاه برقرار نشد.");
        return;
      }
      window.location.href = d.startPayUrl; // هدایت به درگاه
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally {
      setBusyGateway(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-paper rounded-2xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">{isRenew ? "تمدید پلن" : "خرید پلن"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone hover:bg-black/5" aria-label="بستن">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="rounded-xl border border-black/8 bg-white/50 p-4 space-y-2.5 text-sm">
          <Line label="پلن" value={`${planLabel} (${cycle === "annual" ? "سالانه" : "ماهانه"})`} />
          <Line label="مبلغ" value={`${faNum(finalPrice)} تومان`} bold />
          <div className="h-px bg-black/6" />
          <Line label="موجودی کیف‌پول" value={`${faNum(walletBalance)} تومان`} />
          {enough ? (
            <Line label="موجودی پس از خرید با کیف‌پول" value={`${faNum(walletBalance - finalPrice)} تومان`} />
          ) : (
            <Line label="کسری کیف‌پول" value={`${faNum(shortBy)} تومان`} ember />
          )}
        </div>

        {/* روش ۱ — کیف‌پول */}
        <button
          onClick={buyWithWallet}
          disabled={busy || !enough}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-paper text-sm hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {busyWallet && <Spinner size={13} />}
          {isRenew ? "تمدید" : "خرید"} با کیف‌پول
        </button>
        {!enough && (
          <p className="text-[10px] text-fog/70 text-center mt-1.5 leading-relaxed">
            موجودی کافی نیست —{" "}
            <Link href="/settings/profile" className="text-ember hover:underline">شارژ کیف‌پول</Link>
            {" "}یا پرداخت مستقیم آنلاین.
          </p>
        )}

        {/* روش ۲ — درگاه مستقیم */}
        <button
          onClick={buyWithGateway}
          disabled={busy}
          className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-black/12 text-ink text-sm hover:bg-black/4 transition-colors disabled:opacity-40"
        >
          {busyGateway && <Spinner size={13} />}
          پرداخت مستقیم از درگاه آنلاین
        </button>
        <p className="text-[10px] text-fog/70 text-center mt-2 leading-relaxed">
          در پرداخت مستقیم، مبلغ از کیف‌پول کم نمی‌شود — به درگاه امن هدایت می‌شوی.
        </p>
      </div>
    </div>,
    document.body
  );
}

function Line({ label, value, bold, ember }: { label: string; value: string; bold?: boolean; ember?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone text-[13px]">{label}</span>
      <span className={`fa-num ${ember ? "text-ember" : "text-ink"} ${bold ? "font-bold" : ""}`}>{value}</span>
    </div>
  );
}
