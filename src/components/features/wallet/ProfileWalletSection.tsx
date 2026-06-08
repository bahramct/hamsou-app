"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ProfileWalletSection — بخش کیف‌پول در صفحهٔ پروفایل (DECISION-062)
// خلاصه: موجودی + کارت‌های ثبت‌شده (حداکثر ۲) + ۳ تراکنش اخیر + لینک به /wallet
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { onlyDigits } from "@/lib/utils/digits";
import { TopupPanel } from "@/components/features/wallet/TopupPanel";
import { WalletReceiptModal } from "@/components/features/wallet/WalletReceiptModal";

export interface ProfileWalletTx {
  id: string;
  type: string;
  amount: number;
  status: string;
  refCode: string;
  createdAt: string;
}

interface Props {
  balance: number;
  cardNumber: string | null;
  cardNumber2: string | null;
  recentTxs: ProfileWalletTx[];
}

function groupCard(num: string): string {
  return (num.match(/.{1,4}/g) ?? [num]).join(" - ");
}

function faDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { month: "2-digit", day: "2-digit" });
  } catch { return iso; }
}

const STATUS_CLS: Record<string, string> = {
  pending: "text-amber-700 bg-amber-400/12",
  approved: "text-sage-deep bg-sage/12",
  completed: "text-sage-deep bg-sage/12",
  rejected: "text-ember bg-ember/10",
};

function txLabel(t: ProfileWalletTx): string {
  if (t.type === "topup") return "شارژ";
  if (t.type === "purchase") return "خرید پلن";
  return "اصلاح";
}

export function ProfileWalletSection({ balance, cardNumber, cardNumber2, recentTxs }: Props) {
  const router = useRouter();
  const [showTopup, setShowTopup] = useState(false);
  const [receiptTx, setReceiptTx] = useState<string | null>(null);

  // مدیریت ۲ کارت
  const [editSlot, setEditSlot] = useState<null | 1 | 2>(null);
  const [cardInput, setCardInput] = useState("");
  const [saving, setSaving] = useState(false);

  const hasCard1 = Boolean(cardNumber);
  const hasCard2 = Boolean(cardNumber2);
  const canAddCard2 = hasCard1 && !hasCard2;

  function startEdit(slot: 1 | 2, existing: string | null) {
    setEditSlot(slot);
    setCardInput(existing ?? "");
  }

  async function saveCard(slot: 1 | 2) {
    const cn = onlyDigits(cardInput);
    if (cn.length !== 16) { toast.error("شماره کارت باید ۱۶ رقم باشد."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/account/payment-card", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: cn, slot }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "ذخیره ناموفق بود."); return; }
      toast.success(`کارت ${slot === 2 ? "دوم" : "اول"} ذخیره شد`);
      setEditSlot(null);
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setSaving(false); }
  }

  async function removeCard(slot: 1 | 2) {
    setSaving(true);
    try {
      const res = await fetch("/api/account/payment-card", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot }),
      });
      if (!res.ok) { toast.error("حذف ناموفق بود."); return; }
      toast.success(`کارت ${slot === 2 ? "دوم" : "اول"} حذف شد`);
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setSaving(false); }
  }

  return (
    <section className="glass rounded-2xl overflow-hidden">
      {/* ── هدر موجودی ── */}
      <div className="bg-gradient-to-br from-sage/12 to-mist/10 px-6 pt-5 pb-5 flex items-center justify-between gap-4 border-b border-black/6">
        <div>
          <div className="text-[11px] text-fog mb-0.5">موجودی کیف‌پول</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink fa-num">{balance.toLocaleString("fa-IR")}</span>
            <span className="text-sm text-stone">تومان</span>
          </div>
        </div>
        <button
          onClick={() => setShowTopup(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-paper text-sm hover:bg-charcoal transition-colors shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          شارژ
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* ── کارت‌های پرداخت ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[12px] font-semibold text-stone">کارت‌های پرداخت</h3>
            <span className="text-[10px] text-fog">برای واریز شارژ استفاده می‌شود</span>
          </div>

          <div className="space-y-2">
            {/* کارت اول */}
            <CardSlotRow
              slot={1}
              cardNumber={cardNumber}
              editing={editSlot === 1}
              cardInput={editSlot === 1 ? cardInput : ""}
              saving={saving}
              onEdit={() => startEdit(1, cardNumber)}
              onCancelEdit={() => setEditSlot(null)}
              onChangeInput={(v) => setCardInput(v)}
              onSave={() => saveCard(1)}
              onRemove={() => removeCard(1)}
              label="کارت اول"
            />
            {/* دکمهٔ افزودن کارت اول — وقتی کارتی ثبت نشده */}
            {!hasCard1 && editSlot !== 1 && (
              <button
                onClick={() => startEdit(1, null)}
                className="w-full rounded-xl border border-dashed border-bone py-2 text-[12px] text-fog hover:text-stone hover:border-stone/40 transition-colors"
              >
                + افزودن کارت بانکی
              </button>
            )}
            {/* کارت دوم — فقط اگر کارت اول ثبت شده باشد */}
            {(hasCard2 || canAddCard2) && (
              <CardSlotRow
                slot={2}
                cardNumber={cardNumber2}
                editing={editSlot === 2}
                cardInput={editSlot === 2 ? cardInput : ""}
                saving={saving}
                onEdit={() => startEdit(2, cardNumber2)}
                onCancelEdit={() => setEditSlot(null)}
                onChangeInput={(v) => setCardInput(v)}
                onSave={() => saveCard(2)}
                onRemove={() => removeCard(2)}
                label="کارت دوم"
              />
            )}
            {/* دکمهٔ افزودن کارت دوم — فقط اگر کارت اول ثبت و کارت دوم نیست */}
            {canAddCard2 && editSlot !== 2 && (
              <button
                onClick={() => startEdit(2, null)}
                className="w-full rounded-xl border border-dashed border-bone py-2 text-[12px] text-fog hover:text-stone hover:border-stone/40 transition-colors"
              >
                + افزودن کارت دوم
              </button>
            )}
          </div>
        </div>

        {/* ── تراکنش‌های اخیر ── */}
        {recentTxs.length > 0 && (
          <div>
            <div className="text-[12px] font-semibold text-stone mb-2">تراکنش‌های اخیر</div>
            <ul className="space-y-1.5">
              {recentTxs.map((t) => {
                const positive = t.amount >= 0;
                const stCls = STATUS_CLS[t.status] ?? "text-stone bg-black/4";
                const canReceipt = t.status === "approved" || t.status === "completed";
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-black/3 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] text-ink">{txLabel(t)}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${stCls}`}>
                          {t.status === "pending" ? "در انتظار" : t.status === "rejected" ? "رد شد" : "انجام شد"}
                        </span>
                      </div>
                      <div className="text-[10px] text-fog mt-0.5">{faDate(t.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-semibold fa-num ${positive ? "text-sage-deep" : "text-ink"}`}>
                        {positive ? "+" : "−"}{Math.abs(t.amount).toLocaleString("fa-IR")}
                      </span>
                      {canReceipt && (
                        <button
                          onClick={() => setReceiptTx(t.id)}
                          className="text-[10px] text-stone hover:text-ink underline underline-offset-2"
                        >
                          رسید
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/wallet"
              className="mt-2.5 flex items-center justify-center gap-1.5 text-[12px] text-stone hover:text-ink transition-colors py-1.5"
            >
              مشاهدهٔ همهٔ تراکنش‌ها
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
        )}

        {recentTxs.length === 0 && (
          <p className="text-[12px] text-fog text-center py-2">هنوز تراکنشی ثبت نشده.</p>
        )}
      </div>

      {showTopup && (
        <TopupPanel
          hasCard={hasCard1}
          cardNumber={cardNumber}
          cardNumber2={cardNumber2}
          onClose={() => setShowTopup(false)}
          onDone={() => router.refresh()}
        />
      )}
      {receiptTx && <WalletReceiptModal txId={receiptTx} onClose={() => setReceiptTx(null)} />}
    </section>
  );
}

function CardSlotRow({
  slot, cardNumber, editing, cardInput, saving,
  onEdit, onCancelEdit, onChangeInput, onSave, onRemove, label,
}: {
  slot: 1 | 2;
  cardNumber: string | null;
  editing: boolean;
  cardInput: string;
  saving: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onChangeInput: (v: string) => void;
  onSave: () => void;
  onRemove: () => void;
  label: string;
}) {
  if (editing) {
    return (
      <div className="rounded-xl border border-sage/30 bg-sage/4 px-3 py-2.5 space-y-2">
        <div className="text-[11px] text-stone">{label}</div>
        <div className="flex items-center gap-2">
          <input
            value={cardInput}
            onChange={(e) => onChangeInput(e.target.value)}
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            placeholder="0000 0000 0000 0000"
            className="flex-1 rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage num-latin text-center"
          />
          <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-ink text-paper text-xs disabled:opacity-40">
            {saving && <Spinner size={11} />} ذخیره
          </button>
          <button onClick={onCancelEdit} disabled={saving} className="px-2 py-2 rounded-lg text-xs text-stone hover:bg-black/4">×</button>
        </div>
      </div>
    );
  }

  if (!cardNumber) return null;

  return (
    <div className="rounded-xl border border-bone bg-white/40 px-3 py-2.5 flex items-center justify-between gap-2">
      <div>
        <div className="text-[10px] text-fog mb-0.5">{label}</div>
        <div dir="ltr" className="text-sm font-semibold text-ink num-latin tracking-wider">{groupCard(cardNumber)}</div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={onEdit} className="text-[11px] text-stone hover:text-ink px-1.5 py-1 rounded hover:bg-black/4">ویرایش</button>
        {slot === 2 && (
          <button onClick={onRemove} className="text-[11px] text-ember hover:text-ember px-1.5 py-1 rounded hover:bg-ember/6">حذف</button>
        )}
      </div>
    </div>
  );
}
