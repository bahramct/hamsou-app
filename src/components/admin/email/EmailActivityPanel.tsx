"use client";

// ارسال تستی + تاریخچهٔ ارسال (آینهٔ SmsActivityPanel)

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { EmailDeliveryLog, type EmailLogView } from "@/components/admin/email/EmailDeliveryLog";

interface Props {
  initialLogs: EmailLogView[];
  canSend: boolean;
}

export function EmailActivityPanel({ initialLogs, canSend }: Props) {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<EmailLogView[]>(initialLogs);

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim()) return;
    setSending(true);
    const res = await fetch("/api/admin/email/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("ایمیل تستی ارسال شد.");
      await refreshLogs();
    } else {
      toast.error(data.error ?? "ارسال ناموفق بود.");
    }
    setSending(false);
  }

  async function refreshLogs() {
    setRefreshing(true);
    const res = await fetch("/api/admin/email/logs");
    if (res.ok) {
      const data = await res.json();
      const PURPOSE_LABELS: Record<string, string> = {
        signup: "ثبت‌نام",
        "add-email": "افزودن ایمیل",
        "password-reset": "بازیابی رمز",
        test: "ارسال تستی",
      };
      setLogs(
        (data.logs as EmailLogView[]).map((l) => ({
          ...l,
          purposeLabel: PURPOSE_LABELS[l.purpose] ?? l.purpose,
        }))
      );
    }
    setRefreshing(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {canSend && (
        <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">ارسال تستی</h2>
          <p className="text-xs text-fog mb-4">
            یک ایمیل آزمایشی به آدرس زیر ارسال می‌شود تا مطمئن شوی سرویس فعال درست کار می‌کند.
          </p>
          <form onSubmit={sendTest} className="flex gap-2 flex-wrap">
            <input
              dir="ltr"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="آدرس ایمیل گیرنده"
              disabled={sending}
              className="flex-1 min-w-[220px] text-sm rounded-xl px-4 py-2.5 border border-black/10 bg-white/70 focus:outline-none focus:border-sage disabled:opacity-50 font-mono"
            />
            <button
              type="submit"
              disabled={sending || !to.trim()}
              className="text-sm px-5 py-2.5 rounded-xl bg-ink text-paper hover:bg-charcoal transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {sending && <Spinner size={14} className="text-paper" />}
              ارسال تست
            </button>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">تاریخچهٔ ارسال</h2>
            <p className="text-xs text-fog mt-0.5">آخرین ۵۰ ارسال سیستمی</p>
          </div>
          <button
            onClick={refreshLogs}
            disabled={refreshing}
            className="text-xs px-3 py-1.5 rounded-lg border border-black/10 hover:bg-black/5 transition-colors text-stone flex items-center gap-1"
          >
            {refreshing ? <Spinner size={10} /> : "↻"} بروزرسانی
          </button>
        </div>
        <EmailDeliveryLog logs={logs} />
      </section>
    </div>
  );
}
