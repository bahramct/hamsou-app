"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PaymentGatewayManager — تنظیمِ درگاهِ پرداختِ آنلاین (DECISION-071)
// تک‌ردیفِ کانفیگ: provider + merchantId (فقط Owner) + sandbox + فعال.
// در حالتِ dev پرداخت همیشه آزمایشی است (§۱۳)؛ زرین‌پالِ واقعی فقط در prod.
// DECISION-053: متنِ دکمه ثابت + Spinner؛ نتیجه با toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export interface GatewayView {
  label: string;
  provider: string; // "zarinpal" | "mock"
  isSandbox: boolean;
  isActive: boolean;
  hasMerchantId: boolean;
  merchantId: string | null; // فقط برای Owner پر است
  note: string | null;
}

export function PaymentGatewayManager({
  gateway,
  canManage,
  isOwner,
}: {
  gateway: GatewayView | null;
  canManage: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [label, setLabel] = useState(gateway?.label ?? "زرین‌پال");
  const [provider, setProvider] = useState(gateway?.provider ?? "zarinpal");
  const [merchantId, setMerchantId] = useState(gateway?.merchantId ?? "");
  const [isSandbox, setIsSandbox] = useState(gateway?.isSandbox ?? false);
  const [isActive, setIsActive] = useState(gateway?.isActive ?? true);
  const [note, setNote] = useState(gateway?.note ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!canManage) return;
    setBusy(true);
    const payload: Record<string, unknown> = { label, provider, isSandbox, isActive, note };
    if (isOwner) payload.merchantId = merchantId.trim();
    try {
      const res = await fetch("/api/admin/payment/gateway", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "ذخیره ناموفق بود."); return; }
      toast.success("درگاه پرداخت ذخیره شد");
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage";
  const hasMerchant = gateway?.hasMerchantId || merchantId.trim().length > 0;

  // وضعیتِ زندهٔ آنچه با ذخیره اعمال می‌شود — بر اساس انتخابِ فعلیِ فرم
  const mode =
    provider === "mock"
      ? {
          label: "ماک محلی",
          tone: "border-mist/40 bg-mist/10 text-charcoal",
          desc: "آنی و بدونِ صفحهٔ درگاه — فقط برای تستِ آفلاین/CI. صفحهٔ واقعیِ زرین‌پال باز نمی‌شود.",
          ok: true,
        }
      : isSandbox
        ? {
            label: "سندباکسِ زرین‌پال (تست)",
            tone: "border-sage/40 bg-sage/8 text-sage-deep",
            desc: "کاربر به صفحهٔ واقعیِ sandbox.zarinpal.com می‌رود و پرداختِ آزمایشی می‌کند — هیچ پولِ واقعی جابه‌جا نمی‌شود. (merchant_id لازم نیست؛ هر UUIDی قبول است.)",
            ok: true,
          }
        : {
            label: "تولید — پرداختِ واقعی",
            tone: hasMerchant ? "border-ember/40 bg-ember/8 text-ember" : "border-ember/50 bg-ember/10 text-ember",
            desc: hasMerchant
              ? "⚠️ پرداختِ واقعی روی payment.zarinpal.com — پولِ کاربر واقعاً کسر می‌شود."
              : "⚠️ تولید نیاز به merchant_id واقعی دارد — هنوز تنظیم نشده.",
            ok: hasMerchant,
          };

  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-ink">درگاه پرداخت آنلاین</h2>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive && mode.ok ? "bg-sage/15 text-sage-deep" : "bg-ember/10 text-ember"}`}>
          {isActive && mode.ok ? "آماده" : "ناقص / غیرفعال"}
        </span>
      </div>
      <p className="text-xs text-fog mb-3 leading-relaxed">
        کاربر با این درگاه کیف‌پولش را شارژ می‌کند و موجودی <b>اتوماتیک</b> اضافه می‌شود (بدونِ تأیید دستی).
      </p>

      {/* بنرِ وضعیتِ زنده — دقیقاً نشان می‌دهد با ذخیره چه اتفاقی می‌افتد */}
      <div className={`rounded-xl border px-4 py-3 mb-4 ${mode.tone}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] text-fog">حالتِ فعال پس از ذخیره:</span>
          <span className="text-sm font-semibold">{mode.label}</span>
          {!isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ember/10 text-ember">غیرفعال</span>}
        </div>
        <p className="text-[11px] leading-relaxed opacity-90">{mode.desc}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-stone">برچسب</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} disabled={!canManage} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-stone">نوع درگاه</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} disabled={!canManage} className={inputCls}>
            <option value="zarinpal">زرین‌پال</option>
            <option value="mock">آزمایشی (Mock)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-stone">
            کدِ درگاه (merchant_id)
            {!isOwner && <span className="text-fog"> — فقط مالک می‌تواند ببیند/تغییر دهد</span>}
          </label>
          {isOwner ? (
            <input
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              disabled={!canManage}
              dir="ltr"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className={`${inputCls} num-latin`}
            />
          ) : (
            <div className="text-xs rounded-lg px-3 py-2 bg-black/3 text-stone">
              {gateway?.hasMerchantId ? "تنظیم‌شده ✓" : "تنظیم‌نشده"}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap mt-3">
        <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={!canManage} /> فعال
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
          <input type="checkbox" checked={isSandbox} onChange={(e) => setIsSandbox(e.target.checked)} disabled={!canManage} /> سندباکس (تست — بدون پول واقعی)
        </label>
      </div>

      <div className="flex flex-col gap-1 mt-3">
        <label className="text-[11px] font-medium text-stone">یادداشت (اختیاری)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} disabled={!canManage} className={inputCls} />
      </div>

      {canManage && (
        <button
          onClick={save}
          disabled={busy}
          className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-ink text-paper text-sm hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {busy && <Spinner />}
          ذخیره
        </button>
      )}
    </section>
  );
}
