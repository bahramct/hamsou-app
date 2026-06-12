"use client";

// ─────────────────────────────────────────────────────────────────────────────
// NotificationBell — ناقوس اعلان در AppNav (DECISION-046)
// fetch هنگام mount + باز شدن، polling سبک هر ۶۰ ثانیه برای شمارش خوانده‌نشده.
// real-time واقعی (WebSocket) بعد از سرور — channel در مدل از همین حالا آماده است.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { toFaDigits } from "@/lib/utils/digits";
import { NotificationItem } from "./NotificationItem";
import type { SerializedNotification } from "@/types/notification";

const POLL_MS = 60_000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SerializedNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const d = (await res.json()) as { unread: number; items: SerializedNotification[] };
      setItems(d.items);
      setUnread(d.unread);
      setLoaded(true);
    } catch {
      // اتصال نشد — بی‌صدا
    }
  }, []);

  // mount + polling + گوش‌دادن به refresh event از MarkNotificationsRead
  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    window.addEventListener("hamsoo:notif:refresh", load);
    return () => {
      clearInterval(t);
      window.removeEventListener("hamsoo:notif:refresh", load);
    };
  }, [load]);

  // بستن با کلیک بیرون / Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      // باز کردنِ پنل = دیده‌شدنِ اعلان‌ها → badge همان لحظه پاک می‌شود.
      // آیتم‌ها در همین باز شدن هنوز با استایلِ خوانده‌نشده دیده می‌شوند (فقط شمارنده صفر می‌شود).
      void (async () => {
        await load(); // اول فهرستِ تازه (تا race با read-all پیش نیاید)
        setUnread(0);
        fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {
          /* با polling بعدی هماهنگ می‌شود */
        });
      })();
    }
  }

  const markRead = useCallback(async (id: string) => {
    // خوش‌بینانه
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      /* بعداً با polling هماهنگ می‌شود */
    }
  }, []);

  async function markAll() {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnread(0);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      /* بی‌صدا */
    }
  }

  async function clearAll() {
    setItems([]);
    setUnread(0);
    try {
      await fetch("/api/notifications/clear-all", { method: "DELETE" });
    } catch {
      /* بی‌صدا */
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={toggle}
        className="relative p-2 rounded-xl text-stone hover:text-ink hover:bg-black/4 transition-all duration-250"
        aria-label="اعلان‌ها"
        aria-expanded={open}
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute top-1 left-1 min-w-4 h-4 px-1 flex items-center justify-center
            rounded-full bg-ember text-paper text-[9px] font-medium fa-num leading-none">
            {unread > 9 ? "۹+" : toFaDigits(unread)}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-black/8
            bg-white shadow-xl shadow-black/10 overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/6">
            <span className="text-sm font-semibold text-ink">یادآوری‌ها</span>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button onClick={markAll} className="text-[11px] text-stone hover:text-ink">
                  خواندن همه
                </button>
              )}
              {items.length > 0 && (
                <button onClick={clearAll} className="text-[11px] text-fog hover:text-ember transition-colors">
                  پاک کردن همه
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-black/5 [&::-webkit-scrollbar]:hidden scrollbar-none">
            {!loaded ? (
              <p className="px-4 py-8 text-center text-xs text-fog">در حال بارگذاری…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-xs text-fog">یادآوری‌ای نیست.</p>
            ) : (
              items.slice(0, 20).map((n) => (
                <NotificationItem key={n.id} n={n} onRead={markRead} onNavigate={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 2.25a4 4 0 0 0-4 4v2.4l-1.2 2.4h10.4L13 8.65v-2.4a4 4 0 0 0-4-4Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
      />
      <path d="M7.25 13.5a1.75 1.75 0 0 0 3.5 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
