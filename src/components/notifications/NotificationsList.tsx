"use client";

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsList — لیست کامل صفحهٔ /notifications (DECISION-046)
// به‌روزرسانی خوش‌بینانه؛ هر آیتم لینک‌دار، با کلیک خوانده می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { NotificationItem } from "./NotificationItem";
import type { SerializedNotification } from "@/types/notification";

export function NotificationsList({ initial }: { initial: SerializedNotification[] }) {
  const [items, setItems] = useState(initial);
  const hasUnread = items.some((n) => n.readAt === null);

  async function markRead(id: string) {
    setItems((p) => p.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      /* بی‌صدا — بار بعد همگام می‌شود */
    }
  }

  async function markAll() {
    setItems((p) => p.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      /* بی‌صدا */
    }
  }

  async function clearAll() {
    setItems([]);
    try {
      await fetch("/api/notifications/clear-all", { method: "DELETE" });
    } catch {
      /* بی‌صدا */
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-sm text-stone">یادآوری‌ای نداری.</p>
        <p className="text-xs text-fog">رویدادهای مهم (پاسخ پشتیبانی، تغییر پلن و…) اینجا ظاهر می‌شوند.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-4">
        {hasUnread && (
          <button onClick={markAll} className="text-xs text-stone hover:text-ink transition-colors">
            خواندن همه
          </button>
        )}
        <button onClick={clearAll} className="text-xs text-fog hover:text-ember transition-colors">
          پاک کردن همه
        </button>
      </div>
      <div className="rounded-2xl border border-black/8 bg-white/50 overflow-hidden divide-y divide-black/5">
        {items.map((n) => (
          <NotificationItem key={n.id} n={n} onRead={markRead} />
        ))}
      </div>
    </div>
  );
}
