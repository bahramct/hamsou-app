"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SmsTestSender — ارسال تستی پیامک از مسیر سرویسِ فعال (DECISION-061)
// مالک یک شماره وارد می‌کند → کد تستی از مسیر سرویسِ فعال ارسال می‌شود → نتیجه با toast.
// طبق DECISION-053: متن دکمه عوض نمی‌شود؛ فقط Spinner + toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { onlyDigits, toFaDigits } from "@/lib/utils/digits";

interface Props {
  canSend: boolean;
  onSent?: () => void; // برای رفرش لاگ
}

export function SmsTestSender({ canSend, onSent }: Props) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const normalized = onlyDigits(phone);
    if (normalized.length < 10) {
      toast.error("شماره موبایل معتبر نیست.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const d = await res.json();
      if (d.ok) {
        const where = d.provider === "smsir" ? (d.isSandbox ? "sms.ir (سندباکس)" : "sms.ir") : "آزمایشی (Mock)";
        toast.success(`ارسال موفق از مسیر ${where}`);
      } else {
        toast.error(d.error ?? "ارسال ناموفق بود.");
      }
      onSent?.();
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (!canSend) return null;

  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <h2 className="text-sm font-semibold text-ink mb-1">ارسال تستی</h2>
      <p className="text-xs text-fog mb-3">
        یک کد تستی از مسیرِ سرویسِ فعال می‌فرستد تا مطمئن شوی مسیر درست کار می‌کند. نتیجه (provider و sandbox) در توست و در «تاریخچهٔ ارسال» پایین دیده می‌شود.
      </p>
      <div className="flex items-center gap-2 max-w-sm">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="numeric"
          dir="ltr"
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          className="flex-1 rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage num-latin text-center"
        />
        <button
          onClick={send}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-ink text-paper text-sm hover:bg-charcoal transition-colors disabled:opacity-40 shrink-0"
        >
          {busy && <Spinner />}
          ارسال تستی
        </button>
      </div>
      {phone && (
        <p className="text-[11px] text-fog mt-2 num-latin" dir="ltr">{toFaDigits(onlyDigits(phone))}</p>
      )}
    </section>
  );
}
