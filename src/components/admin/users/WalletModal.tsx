"use client";

// مودال کیف‌پول کاربر — شارژ/کسر از صفحهٔ جزئیات ادمین
// الگوی مودال: Portal + انیمیشن + قفلِ اسکرول + Escape (DECISION-085)
// محتوا: منطقِ AdminWalletCharge داخل مودال

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Portal } from "@/components/ui/Portal";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import { onlyDigits, toEnDigits, toFaDigits } from "@/lib/utils/digits";

interface Props {
  userId: string;
  balance: number;
  onClose: () => void;
}

export function WalletModal({ userId, balance, onClose }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  const amountNum = parseInt(onlyDigits(toEnDigits(amount)) || "0", 10);

  async function submit() {
    if (saving) return;
    if (!amountNum || amountNum <= 0) { toast.error("مبلغ را وارد کن."); return; }
    if (!note.trim()) { toast.error("یادداشت (دلیل) را وارد کن."); return; }
    if (mode === "debit" && amountNum > balance) {
      toast.error("کسر بیش از موجودیِ کاربر مجاز نیست.");
      return;
    }
    const delta = mode === "credit" ? amountNum : -amountNum;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: delta, note: note.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) { toast.error(data?.error ?? "عملیات ناموفق بود."); return; }
      toast.success(
        mode === "credit"
          ? `${toFaDigits(amountNum)} تومان به کیف‌پول اضافه شد.`
          : `${toFaDigits(amountNum)} تومان از کیف‌پول کسر شد.`
      );
      setAmount("");
      setNote("");
      startTransition(() => router.refresh());
      close();
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Portal>
      <>
        {/* پس‌زمینه */}
        <div
          aria-hidden
          onClick={close}
          className="fixed inset-0 z-50"
          style={{
            background: "rgba(26,26,31,0.28)",
            backdropFilter: visible ? "blur(8px)" : "none",
            opacity: visible ? 1 : 0,
            transition: "opacity 220ms ease, backdrop-filter 220ms ease",
          }}
        />

        {/* کانتینر مرکزدهنده */}
        <div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-5"
          role="dialog"
          aria-modal="true"
          aria-label="مدیریت کیف‌پول"
        >
          <div
            className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-3xl border border-black/8 shadow-[0_20px_60px_rgba(26,26,31,0.18),0_0_0_1px_rgba(255,255,255,0.5)_inset]"
            style={{
              background: "rgba(var(--rgb-paper),0.94)",
              backdropFilter: "blur(28px) saturate(150%)",
              opacity: visible ? 1 : 0,
              transform: visible ? "scale(1)" : "scale(0.94)",
              transition: "opacity 220ms ease, transform 280ms cubic-bezier(0.19,1,0.22,1)",
            }}
          >
            {/* هدر */}
            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <WalletIconSm />
                <h2 className="text-sm font-semibold text-ink">کیف‌پول</h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="بستن"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-fog hover:text-stone hover:bg-black/5 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* محتوا */}
            <div className="px-5 py-5 space-y-4 max-h-[62vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] overscroll-contain">
              {/* موجودی */}
              <div className="flex items-center justify-between rounded-2xl bg-black/[0.035] border border-black/6 px-4 py-3">
                <span className="text-xs text-fog">موجودی فعلی</span>
                <span className="text-sm font-semibold text-ink fa-num" dir="ltr">
                  {toFaDigits(balance)} <span className="text-xs font-normal text-fog">تومان</span>
                </span>
              </div>

              {/* حالت: شارژ / کسر */}
              <div className="flex gap-2">
                {([
                  { k: "credit", label: "شارژ (+)" },
                  { k: "debit", label: "کسر (−)" },
                ] as const).map((m) => (
                  <button
                    key={m.k}
                    type="button"
                    onClick={() => setMode(m.k)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs transition-all border ${
                      mode === m.k
                        ? m.k === "credit"
                          ? "bg-sage/20 text-sage-deep font-medium border-sage/30"
                          : "bg-ember/15 text-ember font-medium border-ember/30"
                        : "bg-white/50 border-bone text-fog hover:text-stone"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* مبلغ */}
              <input
                value={amount}
                onChange={(e) => setAmount(toFaDigits(onlyDigits(toEnDigits(e.target.value))))}
                inputMode="numeric"
                dir="ltr"
                placeholder="مبلغ به تومان"
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink text-center fa-num placeholder:text-fog focus:outline-none focus:border-sage transition-all"
              />

              {/* یادداشت */}
              <input
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                dir="rtl"
                placeholder="یادداشت / دلیل (اجباری)"
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage transition-all"
              />
            </div>

            {/* فوتر */}
            <div className="flex items-center justify-end gap-2 border-t border-black/6 px-5 py-3.5">
              <button
                type="button"
                onClick={close}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm text-stone border border-bone bg-white/60 hover:border-black/15 hover:text-ink transition-all disabled:opacity-40"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
              >
                {saving && <Spinner size={14} className="text-paper" />}
                اعمال
              </button>
            </div>
          </div>
        </div>
      </>
    </Portal>
  );
}

function WalletIconSm() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden className="text-fog">
      <rect x="1" y="4" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 7h13" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 2h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
