"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminWalletCharge — شارژ/اصلاحِ دستیِ کیف‌پولِ کاربر از صفحهٔ جزئیات (DECISION-089)
// حالت: شارژ (+) یا کسر (−). مبلغ به تومان (ارقامِ فارسی، LTR). یادداشت اجباری.
// → POST /api/admin/users/[id]/wallet  (enforce payment.manage)  → adjustBalance.
// قانون متنِ دکمه (DECISION-053): متنِ دکمه ثابت؛ حین کار فقط Spinner؛ نتیجه با toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { onlyDigits, toEnDigits, toFaDigits } from "@/lib/utils/digits";

export function AdminWalletCharge({ userId, balance }: { userId: string; balance: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const amountNum = parseInt(onlyDigits(toEnDigits(amount)) || "0", 10);

  async function submit() {
    if (saving) return;
    if (!amountNum || amountNum <= 0) {
      toast.error("مبلغ را وارد کن.");
      return;
    }
    if (!note.trim()) {
      toast.error("یادداشت (دلیل) را وارد کن.");
      return;
    }
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
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "عملیات ناموفق بود.");
        return;
      }
      toast.success(
        mode === "credit"
          ? `${toFaDigits(amountNum)} تومان به کیف‌پول اضافه شد.`
          : `${toFaDigits(amountNum)} تومان از کیف‌پول کسر شد.`
      );
      setAmount("");
      setNote("");
      startTransition(() => router.refresh());
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-fog uppercase tracking-widest">کیف‌پول</p>
        <p className="text-xs text-stone">
          موجودی فعلی:{" "}
          <span className="font-medium text-ink fa-num" dir="ltr">
            {toFaDigits(balance)}
          </span>{" "}
          تومان
        </p>
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
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              mode === m.k
                ? m.k === "credit"
                  ? "bg-sage/20 text-sage-deep font-medium border border-sage/30"
                  : "bg-ember/15 text-ember font-medium border border-ember/30"
                : "bg-white/50 border border-bone text-fog hover:text-stone"
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

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
      >
        {saving && <Spinner />}
        اعمال
      </button>
    </div>
  );
}
