"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MarkNotificationsRead — پاک‌کردن badge به‌محض ورود به یک بخش (DECISION-046)
//
// یک بار هنگام mount، POST /api/notifications/read-by-type را صدا می‌زند.
// پس از موفقیت، CustomEvent "hamsoo:notif:refresh" را dispatch می‌کند تا
// NotificationBell بلافاصله state خود را بروز کند (بدون انتظار polling 60s).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";

interface Props {
  /** پیشوند نوع اعلان — مثال: "support" برای پاک‌کردن support.replied و … */
  typePrefix: string;
}

export function MarkNotificationsRead({ typePrefix }: Props) {
  useEffect(() => {
    fetch("/api/notifications/read-by-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typePrefix }),
    })
      .then((r) => { if (r.ok) window.dispatchEvent(new CustomEvent("hamsoo:notif:refresh")); })
      .catch(() => { /* بی‌صدا */ });
  }, [typePrefix]);

  return null;
}
