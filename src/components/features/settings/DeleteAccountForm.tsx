"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DeleteAccountForm — حذف حساب با تأیید دومرحله‌ای
//
// مرحله ۱: نمایش هشدار + دکمه «می‌خواهم حذف کنم»
// مرحله ۲: ورود شماره موبایل برای تأیید نهایی
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toFaDigits } from "@/lib/utils/digits";

interface Props {
  phone: string;
}

export function DeleteAccountForm({ phone }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneInput, setPhoneInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.message ?? "خطایی رخ داد");
        return;
      }

      // session پاک شده — ریدایرکت به صفحه اصلی
      router.push("/");
    });
  }

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-stone leading-loose">
            با حذف حساب، تمام داده‌های شما — تعهدها، بازخوردها، گزارش‌ها — برای همیشه پاک می‌شوند.
          </p>
          <p className="text-xs text-fog">این عملیات قابل بازگشت نیست.</p>
        </div>

        <button
          type="button"
          onClick={() => setStep(2)}
          className="
            w-full rounded-xl border border-ember/40 bg-transparent
            px-4 py-3 text-sm text-ember
            hover:bg-ember/5 hover:border-ember/70
            transition-all duration-200
          "
        >
          می‌خواهم حساب را حذف کنم
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-stone">
          برای تأیید، شماره موبایل خود را وارد کن:
        </p>
        <p className="text-xs text-fog" dir="ltr">{toFaDigits(phone)}</p>
      </div>

      <input
        type="tel"
        value={phoneInput}
        onChange={(e) => { setPhoneInput(e.target.value); setError(null); }}
        placeholder="شماره موبایل"
        className="
          w-full rounded-xl border border-mist bg-paper/60
          px-4 py-3 text-sm text-ink placeholder:text-fog/50
          focus:outline-none focus:border-ember/40 focus:ring-0
          transition-colors duration-200
        "
        dir="ltr"
      />

      {error && <p className="text-xs text-ember">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setStep(1); setPhoneInput(""); setError(null); }}
          className="flex-1 rounded-xl border border-mist bg-transparent px-4 py-3 text-sm text-stone hover:text-ink transition-colors"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending || !phoneInput.trim()}
          className="
            flex-1 rounded-xl bg-ember/10 border border-ember/40
            px-4 py-3 text-sm text-ember
            hover:bg-ember/20 hover:border-ember/60
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {isPending ? "در حال حذف..." : "حذف نهایی"}
        </button>
      </div>
    </div>
  );
}
