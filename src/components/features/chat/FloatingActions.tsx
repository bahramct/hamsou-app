"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FloatingActions — دو دکمهٔ شناور (همدم + پشتیبانی)
//
// • همهٔ کاربران احرازهویت‌شده: همدم (bubble icon، پایین‌راست)
// • کاربران PRO علاوه بر همدم: پشتیبانی (headset icon، بالای همدم)
// • انحصار متقابل: در هر لحظه فقط یکی از دو پنجره باز است
// • وقتی یکی باز می‌شود دکمه‌ها با انیمیشن محو می‌شوند
// • از طریق CustomEvent «open-support-chat» از صفحهٔ پروفایل قابل فعال‌سازی است
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChatWindow } from "./ChatWindow";
import { SupportChatWindow } from "../support-chat/SupportChatWindow";
import { toFaDigits } from "@/lib/utils/digits";

const UNREAD_POLL_MS = 20_000;

interface Props {
  companionName?: string | null;
  userName?: string | null;
  isAuthenticated?: boolean;
  isPro?: boolean;
}

export function FloatingActions({
  companionName,
  userName,
  isAuthenticated = false,
  isPro = false,
}: Props) {
  const pathname = usePathname();
  const [openChat, setOpenChat] = useState<"companion" | "support" | null>(null);
  const [unread, setUnread] = useState(0);
  const [supportOnline, setSupportOnline] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!isPro) return;
    try {
      const res = await fetch("/api/support/chat/unread", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok && data.allowed) {
        setUnread(typeof data.count === "number" ? data.count : 0);
        setSupportOnline(!!data.online);
      }
    } catch {
      // بی‌صدا
    }
  }, [isPro]);

  // poll badge/online فقط برای PRO
  useEffect(() => {
    if (!isPro) return;
    void refreshUnread();
    const timer = setInterval(() => {
      if (!document.hidden && openChat !== "support") void refreshUnread();
    }, UNREAD_POLL_MS);
    const onVisibility = () => { if (!document.hidden) void refreshUnread(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isPro, refreshUnread, openChat]);

  // گوش دادن به رویداد سفارشی از SupportChatCard در صفحهٔ پروفایل
  useEffect(() => {
    if (!isPro) return;
    const handler = () => setOpenChat("support");
    window.addEventListener("open-support-chat", handler);
    return () => window.removeEventListener("open-support-chat", handler);
  }, [isPro]);

  const closeAll = () => {
    setOpenChat(null);
    if (isPro) void refreshUnread();
  };

  // ادمین یا کاربر غیراحرازهویت‌شده: نمایش داده نمی‌شود
  if (!isAuthenticated || pathname.startsWith("/admin")) return null;

  const fabsVisible = openChat === null;

  return (
    <>
      {/* ── دکمهٔ پشتیبانی — فقط PRO ──────────────────────────────────────── */}
      {isPro && (
        <button
          type="button"
          onClick={() => setOpenChat("support")}
          aria-label="پشتیبانی آنلاین همسو"
          className="fixed z-40 w-14 h-14 rounded-full bg-gold text-paper
                     flex items-center justify-center
                     shadow-[0_4px_20px_rgba(193,154,74,0.36)]
                     hover:shadow-[0_6px_28px_rgba(193,154,74,0.46)]"
          style={{
            bottom: "5.75rem",
            right: "1.5rem",
            opacity: fabsVisible ? 1 : 0,
            transform: fabsVisible ? "scale(1)" : "scale(0.88)",
            pointerEvents: fabsVisible ? "auto" : "none",
            transition: "opacity 250ms ease, transform 300ms cubic-bezier(0.19,1,0.22,1), box-shadow 200ms ease",
          }}
        >
          <HeadsetIcon />
          {/* badge پیام خوانده‌نشده */}
          {unread > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-ember text-paper text-[10px] font-bold flex items-center justify-center fa-num shadow-paper-sm">
              {unread > 9 ? toFaDigits("9+") : toFaDigits(String(unread))}
            </span>
          )}
          {/* نقطهٔ آنلاین */}
          {supportOnline && (
            <span
              aria-hidden
              className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-paper bg-sage"
            />
          )}
        </button>
      )}

      {/* ── دکمهٔ همدم — همهٔ کاربران ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpenChat("companion")}
        aria-label="باز کردن گفتگو با همدم"
        className="fixed bottom-6 right-6 z-40
                   w-14 h-14 rounded-full
                   bg-ink text-paper
                   flex items-center justify-center
                   shadow-[0_4px_20px_rgba(26,26,31,0.28)]
                   hover:shadow-[0_6px_28px_rgba(26,26,31,0.36)]"
        style={{
          opacity: fabsVisible ? 1 : 0,
          transform: fabsVisible ? "scale(1)" : "scale(0.88)",
          pointerEvents: fabsVisible ? "auto" : "none",
          transition: "opacity 250ms ease, transform 300ms cubic-bezier(0.19,1,0.22,1), box-shadow 200ms ease",
        }}
      >
        <BubbleIcon />
      </button>

      {/* ── پنجره‌های چت ──────────────────────────────────────────────────────── */}
      <ChatWindow
        isOpen={openChat === "companion"}
        onClose={closeAll}
        companionName={companionName ?? null}
        userName={userName ?? null}
      />
      {isPro && (
        <SupportChatWindow
          isOpen={openChat === "support"}
          onClose={closeAll}
          onSeen={() => setUnread(0)}
        />
      )}
    </>
  );
}

function BubbleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="text-paper">
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
