"use client";

// ─────────────────────────────────────────────────────────────────────────────
// WalletPanel — پنلِ کیف‌پولِ کاربر (DECISION-062)
// موجودی + کارتِ پرداختِ من + شارژ + تاریخچهٔ تراکنش + رسید. هم‌تراز با /plans (خرید از موجودی).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { onlyDigits } from "@/lib/utils/digits";
import { TopupPanel } from "@/components/features/wallet/TopupPanel";
import { WalletReceiptModal } from "@/components/features/wallet/WalletReceiptModal";

export interface WalletTx {
  id: string;
  type: string;
  amount: number;
  status: string;
  refCode: string;
  planKey: string | null;
  cycle: string | null;
  adminNote: string | null;
  createdAt: string;
}

interface Props {
  balance: number;
  paymentCardNumber: string | null;
  transactions: WalletTx[];
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "در انتظار تأیید", cls: "bg-amber-400/15 text-amber-700" },
  approved: { label: "تأیید شد", cls: "bg-sage/15 text-sage-deep" },
  completed: { label: "انجام شد", cls: "bg-sage/15 text-sage-deep" },
  rejected: { label: "رد شد", cls: "bg-ember/10 text-ember" },
};

function txTitle(t: WalletTx): string {
  if (t.type === "topup") return "شارژ کیف‌پول";
  if (t.type === "adjust") return "اصلاح موجودی";
  if (t.type === "purchase") {
    const c = t.cycle === "annual" ? "سالانه" : "ماهانه";
    return `خرید پلن (${c})`;
  }
  return "تراکنش";
}

function groupCard(num: string): string {
  return (num.match(/.{1,4}/g) ?? [num]).join("-");
}

function faDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

export function WalletPanel({ balance, paymentCardNumber, transactions }: Props) {
  const router = useRouter();
  const [showTopup, setShowTopup] = useState(false);
  const [receiptTx, setReceiptTx] = useState<string | null>(null);

  // ویرایش کارت
  const [editingCard, setEditingCard] = useState(!paymentCardNumber);
  const [cardInput, setCardInput] = useState(paymentCardNumber ?? "");
  const [savingCard, setSavingCard] = useState(false);

  async function saveCard() {
    const cn = onlyDigits(cardInput);
    if (cn.length !== 16) { toast.error("شماره کارت باید ۱۶ رقم باشد."); return; }
    setSavingCard(true);
    try {
      const res = await fetch("/api/account/payment-card", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: cn }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "ذخیره ناموفق بود."); return; }
      toast.success("کارت پرداخت ذخیره شد");
      setEditingCard(false);
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setSavingCard(false); }
  }

  return (
    <div className="space-y-5">
      {/* موجودی */}
      <div className="rounded-2xl border border-black/8 bg-gradient-to-br from-sage/10 to-mist/10 p-6">
        <div className="text-[12px] text-stone mb-1">موجودی کیف‌پول</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-ink fa-num">{balance.toLocaleString("fa-IR")}</span>
          <span className="text-sm text-stone">تومان</span>
        </div>
        <button
          onClick={() => setShowTopup(true)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-paper text-sm hover:bg-charcoal transition-colors"
        >
          + شارژ کیف‌پول
        </button>
      </div>

      {/* کارت پرداخت من */}
      <div className="rounded-2xl border border-black/8 bg-white/40 p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-ink">کارت پرداخت من</h2>
          {!editingCard && (
            <button onClick={() => setEditingCard(true)} className="text-xs text-stone hover:text-ink">ویرایش</button>
          )}
        </div>
        <p className="text-xs text-fog mb-3 leading-relaxed">
          شماره کارتی که با آن واریز می‌کنی. پشتیبانی هنگام تأیید شارژ، مبدأ واریز را با این کارت تطبیق می‌دهد.
        </p>
        {editingCard ? (
          <div className="flex items-center gap-2">
            <input
              value={cardInput}
              onChange={(e) => setCardInput(e.target.value)}
              inputMode="numeric"
              dir="ltr"
              placeholder="۶۰۳۷۹۹۱۱۱۲۳۴۵۶۷۸"
              className="flex-1 rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage num-latin text-center"
            />
            <button onClick={saveCard} disabled={savingCard} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink text-paper text-sm hover:bg-charcoal transition-colors disabled:opacity-40 shrink-0">
              {savingCard && <Spinner size={13} />}
              ذخیره
            </button>
          </div>
        ) : (
          <div dir="ltr" className="text-base font-semibold text-ink num-latin text-center bg-white/50 border border-bone rounded-lg py-2.5">
            {paymentCardNumber ? groupCard(paymentCardNumber) : "—"}
          </div>
        )}
      </div>

      {/* تاریخچه */}
      <div className="rounded-2xl border border-black/8 bg-white/40 p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">تاریخچهٔ تراکنش‌ها</h2>
        {transactions.length === 0 ? (
          <p className="text-[12px] text-fog bg-black/3 rounded-lg px-3 py-2">هنوز تراکنشی نداری.</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((t) => {
              const st = STATUS[t.status] ?? { label: t.status, cls: "bg-black/5 text-stone" };
              const canReceipt = t.status === "approved" || t.status === "completed";
              const positive = t.amount >= 0;
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/6 bg-white/50 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-ink">{txTitle(t)}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="text-[11px] text-fog mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="num-latin" dir="ltr">{t.refCode}</span>
                      <span>·</span>
                      <span>{faDateTime(t.createdAt)}</span>
                    </div>
                    {t.status === "rejected" && t.adminNote && (
                      <div className="text-[11px] text-ember mt-0.5">دلیل: {t.adminNote}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-sm font-semibold fa-num ${positive ? "text-sage-deep" : "text-ink"}`}>
                      {positive ? "+" : "−"}{Math.abs(t.amount).toLocaleString("fa-IR")}
                    </span>
                    {canReceipt && (
                      <button onClick={() => setReceiptTx(t.id)} className="text-[11px] text-ember hover:underline">رسید</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showTopup && (
        <TopupPanel
          hasCard={Boolean(paymentCardNumber)}
          onClose={() => setShowTopup(false)}
          onDone={() => router.refresh()}
        />
      )}
      {receiptTx && <WalletReceiptModal txId={receiptTx} onClose={() => setReceiptTx(null)} />}
    </div>
  );
}
