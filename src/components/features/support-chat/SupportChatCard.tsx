"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SupportChatCard — کارت «پشتیبانی آنلاین» در صفحهٔ پروفایل
//
// PRO: دکمهٔ «گفتگوی زنده» → CustomEvent «open-support-chat» → FloatingActions
//      (پنجرهٔ چت دیگر اینجا نیست — از طریق FAB شناور در پایین صفحه باز می‌شود)
// غیرPRO: کارت دعوت به ارتقا (بدون پیام منفی)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { toFaDigits } from "@/lib/utils/digits";

const UNREAD_POLL_MS = 20_000;

interface Props {
  allowed: boolean;
}

export function SupportChatCard({ allowed }: Props) {
  const [unread, setUnread] = useState(0);
  const [online, setOnline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!allowed) return;
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
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    void refresh();
    const onVisibility = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    timerRef.current = setInterval(() => {
      if (!document.hidden) void refresh();
    }, UNREAD_POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [allowed, refresh]);

  // ─── حالت غیرپرو: دعوت به ارتقا ──────────────────────────────────────────────
  if (!allowed) {
    return (
      <section className="glass rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center shrink-0 text-stone">
            <HeadsetIcon />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-ink">پشتیبانی آنلاین</h2>
            <p className="text-xs text-fog leading-relaxed">
              گفتگوی زندهٔ متنی با پشتیبان — ویژهٔ پلن حرفه‌ای.
            </p>
          </div>
        </div>
        <Link
          href="/plans"
          className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-sage-deep text-paper text-sm font-medium hover:opacity-90 transition-opacity"
        >
          ارتقا به حرفه‌ای
        </Link>
      </section>
    );
  }

  // ─── حالت پرو: باز کردن از طریق FAB شناور ────────────────────────────────────
  function openChat() {
    window.dispatchEvent(new CustomEvent("open-support-chat"));
  }

  return (
    <section className="glass rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center text-paper">
            <HeadsetIcon />
          </div>
          {/* نقطهٔ آنلاین */}
          <span
            aria-hidden
            className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-paper transition-colors"
            style={{ backgroundColor: online ? "var(--color-sage)" : "var(--color-fog)" }}
          />
          {/* badge پیام خوانده‌نشده */}
          {unread > 0 && (
            <span className="absolute -top-1.5 -left-1.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-ember text-paper text-[10px] font-bold flex items-center justify-center fa-num shadow-paper-sm">
              {unread > 9 ? toFaDigits("9+") : toFaDigits(String(unread))}
            </span>
          )}
        </div>
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-ink">پشتیبانی آنلاین</h2>
          <p className="text-xs leading-relaxed" style={{ color: online ? "var(--color-sage-deep)" : "var(--color-fog)" }}>
            {online ? "پشتیبان آنلاین است — همین حالا گفتگو کن" : "گفتگوی زندهٔ متنی با پشتیبان"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={openChat}
        className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
      >
        گفتگوی زنده
      </button>
    </section>
  );
}

function HeadsetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
