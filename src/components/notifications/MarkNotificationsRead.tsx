"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MarkNotificationsRead — پاک‌کردن badge به‌محض ورود به یک بخش (DECISION-046)
//
// یک بار هنگام mount، POST /api/notifications/read-by-type را صدا می‌زند.
// مصرف: در صفحهٔ /support برای پاک‌کردن badge تیکت‌های پاسخ‌داده‌شده.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";

interface Props {
  /** پیشوند نوع اعلان — مثال: "support" برای پاک‌کردن support.replied و … */
  typePrefix: string;
}

export function MarkNotificationsRead({ typePrefix }: Props) {
  useEffect(() => {
    void fetch("/api/notifications/read-by-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typePrefix }),
    });
  }, [typePrefix]);

  return null;
}
