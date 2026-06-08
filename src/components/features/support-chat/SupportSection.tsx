"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SupportSection — کارت ترکیبی پشتیبانی در پروفایل (تیکت + چت آنلاین)
//
// هر دو قسمت در یک کارت با یک جدا‌کننده نمایش داده می‌شوند.
// دکمه‌ها بر اساس دسترسی پلن فعال/غیرفعال می‌شوند (هم‌ترازی پنل↔پروژه).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { SupportChatWindow } from "./SupportChatWindow";
import { toFaDigits } from "@/lib/utils/digits";

const UNREAD_POLL_MS = 20_000;

interface Props {
  ticketingAllowed: boolean;
  liveChatAllowed: boolean;
}

export function SupportSection({ ticketingAllowed, liveChatAllowed }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [online, setOnline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!liveChatAllowed) return;
    try {
      const res = await fetch("/api/support/chat/unread", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok && data.allowed) {
        setUnread(typeof data.count === "number" ? data.count : 0);
        setOnline(!!data.online);
      }
    } catch {
      // بی‌صدا
    }
  }, [liveChatAllowed]);

  useEffect(() => {
    if (!liveChatAllowed) return;
    void refresh();
    const onVisibility = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    timerRef.current = setInterval(() => {
      if (!document.hidden && !chatOpen) void refresh();
    }, UNREAD_POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [liveChatAllowed, refresh, chatOpen]);

  return (
    <>
      <section className="glass rounded-2xl overflow-hidden">
        {/* ── تیکت‌های پشتیبانی ── */}
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center shrink-0 text-stone mt-0.5">
              <TicketIcon />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-ink">تیکت‌های پشتیبانی</h2>
              <p className="text-xs text-fog leading-relaxed">
                سؤال یا مشکلی داری؟ تیکت بفرست و گفتگو را همان‌جا پیگیری کن.
              </p>
            </div>
          </div>
          {ticketingAllowed ? (
            <Link
              href="/support"
              className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
            >
              تیکت‌های پشتیبانی
            </Link>
          ) : (
            <button
              disabled
              className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-black/8 text-fog text-sm font-medium cursor-not-allowed"
            >
              تیکت‌های پشتیبانی
            </button>
          )}
        </div>

        {/* جداکننده */}
        <div className="mx-6 border-t border-black/6" />

        {/* ── پشتیبانی آنلاین ── */}
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 mt-0.5">
              {liveChatAllowed ? (
                <>
                  <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-paper">
                    <HeadsetIcon />
                  </div>
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-paper"
                    style={{ backgroundColor: online ? "var(--color-sage)" : "var(--color-fog)" }}
                  />
                  {unread > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-ember text-paper text-[10px] font-bold flex items-center justify-center fa-num shadow-paper-sm">
                      {unread > 9 ? toFaDigits("9+") : toFaDigits(unread)}
                    </span>
                  )}
                </>
              ) : (
                <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-stone">
                  <HeadsetIcon />
                </div>
              )}
            </div>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-ink">پشتیبانی آنلاین</h2>
              <p className="text-xs leading-relaxed" style={{
                color: liveChatAllowed && online ? "var(--color-sage-deep)" : "var(--color-fog)"
              }}>
                {liveChatAllowed && online
                  ? "پشتیبان آنلاین است — همین حالا گفتگو کن"
                  : "گفتگوی زنده‌ٔ متنی با پشتیبان — ویژه‌ٔ پلن حرفه‌ای"}
              </p>
            </div>
          </div>
          {liveChatAllowed ? (
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
            >
              گفتگوی زنده
            </button>
          ) : (
            <button
              disabled
              className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-black/8 text-fog text-sm font-medium cursor-not-allowed"
            >
              گفتگوی زنده
            </button>
          )}
        </div>
      </section>

      {liveChatAllowed && (
        <SupportChatWindow
          isOpen={chatOpen}
          onClose={() => { setChatOpen(false); void refresh(); }}
          onSeen={() => setUnread(0)}
        />
      )}
    </>
  );
}

function TicketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6M15 3h6m0 0v6m0-6L10 14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 13a8 8 0 0 1 16 0M4 13v3a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0v3a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
