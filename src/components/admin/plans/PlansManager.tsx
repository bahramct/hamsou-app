"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PlansManager — ویرایش پلن‌ها: قیمت/برچسب/امکانات/bullet (DECISION-040)
// هر پلن یک کارت با ذخیرهٔ مستقل (PATCH /api/admin/plans/[key]).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { onlyDigits } from "@/lib/utils/digits";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export interface FeatureCatalogItem {
  key: string;
  label: string;
  description: string;
  group: string;
  type: "boolean" | "quota";
  unit: string;
  comingSoon: boolean;
}

export interface PlanView {
  key: string;
  label: string;
  description: string;
  order: number;
  monthlyPrice: number;
  annualPrice: number;
  highlight: boolean;
  isActive: boolean;
  bullets: CustomFeature[];
  features: Record<string, { visible: boolean; comingSoon: boolean; disabled: boolean; value: number | null; label: string | null }>;
}

// قابلیت سفارشی (افزودنی از پنل) — مثل کاتالوگ، فلگ نمایش/به‌زودی/غیرفعال دارد.
export interface CustomFeature {
  text: string;
  visible: boolean;
  comingSoon: boolean;
  disabled: boolean;
}

interface Props {
  plans: PlanView[];
  catalog: FeatureCatalogItem[];
  canWrite: boolean;
}

export function PlansManager({ plans, catalog, canWrite }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-ink">پلن‌ها و امکانات</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {plans.map((p) => (
          <PlanCard key={p.key} plan={p} catalog={catalog} canWrite={canWrite} />
        ))}
      </div>
    </section>
  );
}

function toFa(n: number) {
  return n.toLocaleString("fa-IR");
}

function PlanCard({ plan, catalog, canWrite }: { plan: PlanView; catalog: FeatureCatalogItem[]; canWrite: boolean }) {
  const router = useRouter();
  const [label, setLabel] = useState(plan.label);
  const [description, setDescription] = useState(plan.description);
  const [monthlyPrice, setMonthlyPrice] = useState(String(plan.monthlyPrice));
  const [annualPrice, setAnnualPrice] = useState(String(plan.annualPrice));
  const [highlight, setHighlight] = useState(plan.highlight);
  const [isActive, setIsActive] = useState(plan.isActive);
  const [features, setFeatures] = useState(plan.features);
  const [bullets, setBullets] = useState<CustomFeature[]>(plan.bullets);

  function setBullet(i: number, patch: Partial<CustomFeature>) {
    setBullets((prev) => prev.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  }

  const [busy, setBusy] = useState(false);

  const annualMonthly = Number(annualPrice) > 0 ? Math.round(Number(annualPrice) / 12) : 0;

  function setFeature(
    key: string,
    patch: Partial<{ visible: boolean; comingSoon: boolean; disabled: boolean; value: number | null; label: string | null }>
  ) {
    setFeatures((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function save() {
    setBusy(true);
    const payload = {
      label,
      description,
      monthlyPrice: Number(monthlyPrice) || 0,
      annualPrice: Number(annualPrice) || 0,
      highlight,
      isActive,
      features: catalog.map((c) => ({
        featureKey: c.key,
        visible: features[c.key]?.visible ?? true,
        comingSoon: features[c.key]?.comingSoon ?? false,
        disabled: features[c.key]?.disabled ?? false,
        value: c.type === "quota" ? Number(features[c.key]?.value ?? 0) : null,
        label: (features[c.key]?.label ?? "").trim() || null,
      })),
      bullets: bullets
        .filter((b) => b.text.trim())
        .map((b) => ({ text: b.text.trim(), visible: b.visible, comingSoon: b.comingSoon, disabled: b.disabled })),
    };
    try {
      const res = await fetch(`/api/admin/plans/${plan.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "خطا در ذخیره."); return; }
      toast.success(`پلن «${label}» ذخیره شد`);
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className={`rounded-2xl border bg-white/50 p-4 ${highlight ? "border-sage/50" : "border-black/8"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-fog">{plan.key}</span>
          {highlight && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sage/15 text-sage-deep">محبوب</span>}
          {!isActive && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ember/10 text-ember">غیرفعال</span>}
        </div>
      </div>

      <div className="space-y-3">
        <Labeled label="برچسب">
          <input value={label} onChange={(e) => { setLabel(e.target.value); }} disabled={!canWrite} className={inp} />
        </Labeled>
        <Labeled label="توضیح کوتاه">
          <input value={description} onChange={(e) => { setDescription(e.target.value); }} disabled={!canWrite} className={inp} />
        </Labeled>

        <div className="grid grid-cols-2 gap-2">
          <Labeled label="قیمت ماهانه (تومان)">
            <input inputMode="numeric" dir="ltr" value={monthlyPrice} onChange={(e) => { setMonthlyPrice(onlyDigits(e.target.value)); }} disabled={!canWrite} className={inp} />
          </Labeled>
          <Labeled label="قیمت سالانه (تومان)">
            <input inputMode="numeric" dir="ltr" value={annualPrice} onChange={(e) => { setAnnualPrice(onlyDigits(e.target.value)); }} disabled={!canWrite} className={inp} />
          </Labeled>
        </div>
        {annualMonthly > 0 && (
          <p className="text-[11px] text-fog">معادل ماهانه (سالانه): <b className="text-stone">{toFa(annualMonthly)}</b> تومان</p>
        )}

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
            <input type="checkbox" checked={highlight} onChange={(e) => { setHighlight(e.target.checked); }} disabled={!canWrite} />
            محبوب
          </label>
          <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => { setIsActive(e.target.checked); }} disabled={!canWrite} />
            فعال
          </label>
        </div>

        {/* امکانات — هر امکان: متن (قابل ویرایش) + نمایش/عدم‌نمایش + بزودی + غیرفعال + (عددی) مقدار */}
        <div className="border-t border-black/6 pt-3">
          <p className="text-xs font-semibold text-ink mb-2">امکانات</p>
          <div className="space-y-2">
            {catalog.map((c) => {
              const f = features[c.key] ?? { visible: true, comingSoon: false, disabled: false, value: 0, label: null };
              return (
                <div key={c.key} className="rounded-lg border border-black/6 bg-white/40 p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={f.label ?? ""}
                      disabled={!canWrite}
                      onChange={(e) => setFeature(c.key, { label: e.target.value })}
                      placeholder={c.label}
                      className="flex-1 min-w-0 rounded-md px-2 py-1 text-xs bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage disabled:opacity-60"
                    />
                    {c.type === "quota" && (
                      <input
                        inputMode="numeric" dir="ltr" disabled={!canWrite}
                        value={String(f.value ?? 0)}
                        onChange={(e) => setFeature(c.key, { value: Number(onlyDigits(e.target.value) || "0") })}
                        className="w-16 shrink-0 rounded-md px-2 py-1 text-xs bg-white/70 border border-bone text-ink text-center focus:outline-none focus:border-sage disabled:opacity-60"
                        title={c.unit}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[11px]">
                    <button
                      type="button"
                      disabled={!canWrite}
                      onClick={() => setFeature(c.key, { visible: !f.visible })}
                      className="flex items-center gap-1.5 text-stone disabled:opacity-50"
                      aria-pressed={f.visible}
                    >
                      <span className={`relative w-8 h-4 rounded-full transition-colors ${f.visible ? "bg-sage" : "bg-black/15"}`}>
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${f.visible ? "right-0.5" : "right-4"}`} />
                      </span>
                      نمایش
                    </button>
                    <label className="flex items-center gap-1 cursor-pointer text-stone">
                      <input type="checkbox" disabled={!canWrite} checked={f.comingSoon} onChange={(e) => setFeature(c.key, { comingSoon: e.target.checked })} />
                      به‌زودی
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-stone">
                      <input type="checkbox" disabled={!canWrite} checked={f.disabled} onChange={(e) => setFeature(c.key, { disabled: e.target.checked })} />
                      غیرفعال
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* قابلیت‌های سفارشی — مثل کاتالوگ: متن + نمایش (Radio) + به‌زودی + غیرفعال */}
        <div className="border-t border-black/6 pt-3">
          <p className="text-xs font-semibold text-ink mb-2">قابلیت‌های سفارشی</p>
          <div className="space-y-2">
            {bullets.map((b, i) => (
              <div key={i} className="rounded-lg border border-black/6 bg-white/40 p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={b.text} disabled={!canWrite}
                    onChange={(e) => setBullet(i, { text: e.target.value })}
                    className="flex-1 min-w-0 rounded-md px-2 py-1 text-xs bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage disabled:opacity-60"
                    placeholder="مثلاً: دسترسی به شبکهٔ اجتماعی"
                  />
                  {canWrite && (
                    <button type="button" onClick={() => { setBullets(bullets.filter((_, j) => j !== i)); }} className="text-ember text-[11px] shrink-0">حذف</button>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[11px]">
                  <button
                    type="button"
                    disabled={!canWrite}
                    onClick={() => setBullet(i, { visible: !b.visible })}
                    className="flex items-center gap-1.5 text-stone disabled:opacity-50"
                    aria-pressed={b.visible}
                  >
                    <span className={`relative w-8 h-4 rounded-full transition-colors ${b.visible ? "bg-sage" : "bg-black/15"}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${b.visible ? "right-0.5" : "right-4"}`} />
                    </span>
                    نمایش
                  </button>
                  <label className="flex items-center gap-1 cursor-pointer text-stone">
                    <input type="checkbox" disabled={!canWrite} checked={b.comingSoon} onChange={(e) => setBullet(i, { comingSoon: e.target.checked })} />
                    به‌زودی
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-stone">
                    <input type="checkbox" disabled={!canWrite} checked={b.disabled} onChange={(e) => setBullet(i, { disabled: e.target.checked })} />
                    غیرفعال
                  </label>
                </div>
              </div>
            ))}
            {canWrite && (
              <button
                type="button"
                onClick={() => { setBullets([...bullets, { text: "", visible: true, comingSoon: false, disabled: false }]); }}
                className="text-[11px] text-stone hover:text-ink"
              >
                + افزودن قابلیت
              </button>
            )}
          </div>
        </div>

        {canWrite && (
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
          >
            {busy && <Spinner />}
            ذخیرهٔ این پلن
          </button>
        )}
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage disabled:opacity-60";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-stone">{label}</label>
      {children}
    </div>
  );
}
