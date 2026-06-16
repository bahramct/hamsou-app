"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ProfileWalletSection — تایلِ «امور مالی و تراکنش‌ها» (بازطراحی DECISION-096)
// نوارِ موجودی + شارژ (TopupPanel) · کارتِ کارت‌به‌کارت · تراکنش‌های اخیر +
// «مشاهدهٔ همه» در مودال (الگوی تاریخچه). موجودی در هیرو هم نمایش داده می‌شود.
// قواعد: متن دکمه ثابت + Spinner (DECISION-053)، toast برای نتیجه (DECISION-046).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
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
  /** تا ۲۰ تراکنشِ اخیر — ۴ تای اول در تایل، بقیه در مودال */
  recentTxs: ProfileWalletTx[];
}

function groupCard(num: string): string {
  return (num.match(/.{1,4}/g) ?? [num]).join(" - ");
}

function faDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("fa-IR", { day: "numeric", month: "long", year: "numeric" });
    const time = d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    return `${date} · ${time}`;
  } catch { return iso; }
}

function txLabel(t: ProfileWalletTx): string {
  if (t.type === "topup") return "شارژ کیف‌پول";
  if (t.type === "purchase") return "خرید پلن";
  return "اصلاح موجودی";
}

function statusInfo(status: string): { label: string; cls: string } {
  if (status === "pending") return { label: "در انتظار", cls: "pf-st-pending" };
  if (status === "rejected") return { label: "رد شد", cls: "pf-st-rej" };
  return { label: "انجام شد", cls: "pf-st-ok" };
}

// ─── ردیفِ یک تراکنش (مشترکِ تایل و مودال) ─────────────────────────────────────
function TxRow({ t, onReceipt }: { t: ProfileWalletTx; onReceipt: (id: string) => void }) {
  const positive = t.amount >= 0;
  const st = statusInfo(t.status);
  const canReceipt = t.status === "approved" || t.status === "completed";
  return (
    <div className="pf-tx">
      <div className={`pf-tx-ic ${positive ? "up" : "down"}`}>
        {positive ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </div>
      <div className="pf-tx-mid">
        <div className="t">{txLabel(t)} <span className={`pf-st ${st.cls}`}>{st.label}</span></div>
        <div className="d fa-num">{faDateTime(t.createdAt)}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`pf-tx-amt fa-num ${positive ? "pos" : "neg"}`}>
          {positive ? "+" : "−"}{Math.abs(t.amount).toLocaleString("fa-IR")}
        </span>
        {canReceipt && (
          <button onClick={() => onReceipt(t.id)} className="text-[10px] text-stone hover:text-ink underline underline-offset-2">رسید</button>
        )}
      </div>
    </div>
  );
}

export function ProfileWalletSection({ balance, cardNumber, cardNumber2, recentTxs }: Props) {
  const router = useRouter();
  const [showTopup, setShowTopup] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [receiptTx, setReceiptTx] = useState<string | null>(null);

  // مدیریت ۲ کارت
  const [editSlot, setEditSlot] = useState<null | 1 | 2>(null);
  const [cardInput, setCardInput] = useState("");
  const [saving, setSaving] = useState(false);

  const hasCard1 = Boolean(cardNumber);
  const hasCard2 = Boolean(cardNumber2);

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

  const tileTxs = recentTxs.slice(0, 4);

  return (
    <section className="pf-tile pf-t-finance glass" id="finance">
      <div className="pf-tile-head">
        <div className="pf-tile-ic ic-fin"><CardIcon /></div>
        <div>
          <h3>امور مالی و تراکنش‌ها</h3>
          <div className="sub">کیف‌پول، کارت بانکی و تاریخچهٔ پرداخت</div>
        </div>
      </div>

      {/* موجودی + شارژ */}
      <div className="pf-wallet-strip">
        <div className="pf-ws-bal">
          <span className="l">موجودی کیف‌پول</span>
          <span className="v fa-num">{balance.toLocaleString("fa-IR")} <i>تومان</i></span>
        </div>
        <button className="pf-ws-btn" onClick={() => setShowTopup(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          شارژ کیف‌پول
        </button>
      </div>

      {/* کارت‌های کارت‌به‌کارت */}
      {editSlot !== null ? (
        <div className="pf-fin-card" style={{ background: "rgba(122,132,113,.06)" }}>
          <div className="ttl">شمارهٔ کارت {editSlot === 2 ? "دوم" : "—"} برای واریز و کارت‌به‌کارت</div>
          <div className="flex items-center gap-2 mt-2.5">
            <input
              value={cardInput}
              onChange={(e) => setCardInput(e.target.value)}
              inputMode="numeric" dir="ltr" autoComplete="off"
              placeholder="0000 0000 0000 0000"
              className="flex-1 rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage num-latin text-center"
            />
            <button onClick={() => saveCard(editSlot)} disabled={saving} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-ink text-paper text-xs disabled:opacity-40">
              {saving && <Spinner size={11} />} ذخیره
            </button>
            <button onClick={() => setEditSlot(null)} disabled={saving} className="px-2 py-2 rounded-lg text-xs text-stone hover:bg-black/5">×</button>
          </div>
        </div>
      ) : hasCard1 ? (
        <>
          <div className="pf-fin-card">
            <button className="edit" onClick={() => startEdit(1, cardNumber)}>ویرایش</button>
            <div className="ttl">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" /></svg>
              کارت من — برای واریز و کارت‌به‌کارت
            </div>
            <div className="num">{groupCard(cardNumber!)}</div>
          </div>
          {hasCard2 ? (
            <div className="pf-fin-card">
              <button className="edit" onClick={() => startEdit(2, cardNumber2)}>ویرایش</button>
              <div className="ttl">کارت دوم</div>
              <div className="num">{groupCard(cardNumber2!)}</div>
              <button onClick={() => removeCard(2)} className="absolute left-14 top-3.5 text-[11px] text-ember">حذف</button>
            </div>
          ) : (
            <button onClick={() => startEdit(2, null)} className="w-full rounded-xl border border-dashed border-bone py-2 mb-4 text-[12px] text-fog hover:text-stone hover:border-stone/40 transition-colors">
              + افزودن کارت دوم
            </button>
          )}
        </>
      ) : (
        <button onClick={() => startEdit(1, null)} className="pf-fin-card empty">
          + افزودن کارت بانکی برای واریز و کارت‌به‌کارت
        </button>
      )}

      {/* تراکنش‌های اخیر */}
      {tileTxs.length > 0 ? (
        <div className="pf-tx-list">
          {tileTxs.map((t) => <TxRow key={t.id} t={t} onReceipt={setReceiptTx} />)}
        </div>
      ) : (
        <p className="text-[12px] text-fog text-center py-3">هنوز تراکنشی ثبت نشده.</p>
      )}

      <div className="pf-cta-foot">
        <button className="pf-row-link" onClick={() => setShowAll(true)}>
          مشاهدهٔ همهٔ تراکنش‌ها
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
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
      {showAll && <TransactionsModal txs={recentTxs} onReceipt={setReceiptTx} onClose={() => setShowAll(false)} />}
      {receiptTx && <WalletReceiptModal txId={receiptTx} onClose={() => setReceiptTx(null)} />}
    </section>
  );
}

// ─── مودالِ همهٔ تراکنش‌ها (الگوی مودالِ همسو + فیلتر) ─────────────────────────
const TX_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "topup", label: "شارژ" },
  { key: "purchase", label: "خرید پلن" },
  { key: "adjust", label: "اصلاح" },
];

function TransactionsModal({
  txs, onReceipt, onClose,
}: {
  txs: ProfileWalletTx[];
  onReceipt: (id: string) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const filtered = filter === "all" ? txs : txs.filter((t) => t.type === filter);

  return createPortal(
    <>
      <div className="pf-overlay" onClick={onClose} />
      <div className="pf-modal" role="dialog" aria-modal="true">
        <div className="pf-modal-head">
          <h3>امور مالی و تراکنش‌ها</h3>
          <button className="pf-x-btn" onClick={onClose} aria-label="بستن">×</button>
        </div>
        <div className="pf-modal-filters">
          {TX_FILTERS.map((f) => (
            <button key={f.key} className={`pf-chip ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="pf-modal-body">
          {filtered.length === 0 ? (
            <p className="text-[12px] text-fog text-center py-10">تراکنشی در این دسته نیست.</p>
          ) : (
            <div className="pf-tx-list">
              {filtered.map((t) => <TxRow key={t.id} t={t} onReceipt={onReceipt} />)}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

function CardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
