"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SmsActivityPanel — هماهنگ‌کنندهٔ «ارسال تستی» + «تاریخچهٔ ارسال» (DECISION-061)
// state لاگ را نگه می‌دارد تا پس از ارسال تستی، تاریخچه بلافاصله تازه شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useState } from "react";
import { SmsTestSender } from "@/components/admin/sms/SmsTestSender";
import { SmsDeliveryLog, type SmsLogView } from "@/components/admin/sms/SmsDeliveryLog";

interface Props {
  initialLogs: SmsLogView[];
  canSend: boolean;
}

export function SmsActivityPanel({ initialLogs, canSend }: Props) {
  const [logs, setLogs] = useState<SmsLogView[]>(initialLogs);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sms/logs", { cache: "no-store" });
      const d = await res.json();
      if (d?.ok) setLogs(d.logs as SmsLogView[]);
    } catch {
      // بی‌صدا — تاریخچه قبلی می‌ماند
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <SmsTestSender canSend={canSend} onSent={reload} />
      <SmsDeliveryLog logs={logs} loading={loading} onRefresh={reload} />
    </>
  );
}
