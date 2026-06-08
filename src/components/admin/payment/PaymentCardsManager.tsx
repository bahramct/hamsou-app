"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PaymentCardsManager — مدیریت کارت‌های مرجعِ دریافت (DECISION-062؛ آینهٔ SmsServicesManager)
// کارتی که کاربران برای شارژ کیف‌پول به آن واریز می‌کنند. حداکثر یکی پیش‌فرض.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { onlyDigits } from "@/lib/utils/digits";

export interface BankCardView {
  id: string;
  holderName: string;
  cardNumber: string;
  bankName: string;
  isActive: boolean;
  isDefault: boolean;
  note: string | null;
}

function groupCard(num: string): string {
  return (num.match(/.{1,4}/g) ?? [num]).join("-");
}

export function PaymentCardsManager({ cards, canManage }: { cards: BankCardView[]; canManage: boolean }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-ink">کارت‌های مرجع دریافت</h2>
        {canManage && !adding && editingId === null && (
          <button onClick={() => setAdding(true)} className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-ink text-paper hover:bg-charcoal transition-colors">
            + افزودن کارت
          </button>
        )}
      </div>
      <p className="text-xs text-fog mb-4">
        کارتی که کاربران برای شارژ کیف‌پول به آن کارت‌به‌کارت می‌کنند. یکی را «پیش‌فرض» کن — همان به کاربر نمایش داده می‌شود.
      </p>

      {cards.length === 0 && !adding && (
        <p className="text-[11px] text-fog bg-black/3 rounded-lg px-3 py-2">
          هنوز کارتی ثبت نشده. تا یک کارت پیش‌فرض نباشد، کاربران نمی‌توانند شارژ کنند.
        </p>
      )}

      <div className="space-y-2">
        {cards.map((c) =>
          editingId === c.id ? (
            <CardForm key={c.id} mode="edit" card={c} onDone={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
          ) : (
            <CardRow key={c.id} card={c} canManage={canManage} disabled={adding || (editingId !== null && editingId !== c.id)} onEdit={() => setEditingId(c.id)} />
          )
        )}
        {adding && <CardForm mode="create" onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />}
      </div>
    </section>
  );
}

function CardRow({ card, canManage, disabled, onEdit }: { card: BankCardView; canManage: boolean; disabled: boolean; onEdit: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`کارت «${card.holderName}» حذف شود؟`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payment/cards/${card.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("کارت حذف شد"); router.refresh(); }
      else toast.error("حذف ناموفق بود");
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className={`rounded-xl border border-black/8 bg-white/50 px-4 py-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-ink">{card.holderName}</span>
            {card.isDefault && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sage/15 text-sage-deep">پیش‌فرض</span>}
            {!card.isActive && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ember/10 text-ember">غیرفعال</span>}
          </div>
          <div className="text-[11px] text-fog mt-1 flex items-center gap-2 flex-wrap">
            <span className="num-latin" dir="ltr">{groupCard(card.cardNumber)}</span>
            <span>·</span>
            <span>{card.bankName}</span>
          </div>
        </div>
        {canManage && !disabled && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onEdit} className="text-xs text-stone hover:text-ink">ویرایش</button>
            <button onClick={remove} disabled={busy} className="text-xs text-ember hover:underline disabled:opacity-40">حذف</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CardForm({ mode, card, onDone, onCancel }: { mode: "create" | "edit"; card?: BankCardView; onDone: () => void; onCancel: () => void }) {
  const router = useRouter();
  const [holderName, setHolderName] = useState(card?.holderName ?? "");
  const [cardNumber, setCardNumber] = useState(card?.cardNumber ?? "");
  const [bankName, setBankName] = useState(card?.bankName ?? "");
  const [isActive, setIsActive] = useState(card?.isActive ?? true);
  const [isDefault, setIsDefault] = useState(card?.isDefault ?? false);
  const [note, setNote] = useState(card?.note ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    const cn = onlyDigits(cardNumber);
    if (!holderName.trim()) { toast.error("نام صاحب کارت خالی است."); return; }
    if (cn.length !== 16) { toast.error("شماره کارت باید ۱۶ رقم باشد."); return; }
    if (!bankName.trim()) { toast.error("نام بانک خالی است."); return; }
    setBusy(true);
    const payload = { holderName, cardNumber: cn, bankName, isActive, isDefault, note };
    try {
      const url = mode === "create" ? "/api/admin/payment/cards" : `/api/admin/payment/cards/${card!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "ذخیره ناموفق بود."); return; }
      toast.success(mode === "create" ? "کارت اضافه شد" : "کارت ذخیره شد");
      router.refresh();
      onDone();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage";

  return (
    <div className="rounded-xl border border-sage/40 bg-white/70 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-stone">نام صاحب کارت</label>
          <input value={holderName} onChange={(e) => setHolderName(e.target.value)} className={inputCls} placeholder="مثلاً بهرام برازنده" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-stone">نام بانک</label>
          <input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputCls} placeholder="بانک تجارت" />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-stone">شماره کارت (۱۶ رقم)</label>
          <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} inputMode="numeric" dir="ltr" placeholder="6037xxxxxxxxxxxx" className={`${inputCls} num-latin`} />
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> کارت پیش‌فرض
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> فعال
        </label>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-stone">یادداشت (اختیاری)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={save} disabled={busy} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-ink text-paper text-sm hover:bg-charcoal transition-colors disabled:opacity-40">
          {busy && <Spinner />}
          {mode === "create" ? "افزودن کارت" : "ذخیره"}
        </button>
        <button onClick={onCancel} disabled={busy} className="px-3 py-2 rounded-lg text-sm text-stone hover:bg-black/4">انصراف</button>
      </div>
    </div>
  );
}
