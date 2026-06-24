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
  // باز/بستهٔ خوشهٔ speed-dial (فقط برای PRO که دو چت دارد) — DECISION-125
  const [expanded, setExpanded] = useState(false);
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
    setExpanded(false);
    if (isPro) void refreshUnread();
  };

  // باز کردنِ یک چت از خوشه + جمع‌کردنِ speed-dial
  const openChatAndCollapse = (which: "companion" | "support") => {
    setOpenChat(which);
    setExpanded(false);
  };
  // لمسِ دکمهٔ اصلی: رایگان → مستقیم همدم؛ پرو → باز/بستهٔ خوشه
  const onMainTap = () => {
    if (!isPro) { setOpenChat("companion"); return; }
    setExpanded((v) => !v);
  };

  // صفحاتِ عمومی/بازاریابی: چت فقط داخل اپلیکیشن در دسترس است
  const PUBLIC_PREFIXES = [
    "/login", "/plans", "/about", "/contact", "/story",
    "/privacy", "/blog", "/share", "/reset-password",
    "/forgot-password", "/verify-email",
  ];
  const isPublicPage =
    pathname === "/" ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  // ادمین، کاربر غیراحرازهویت‌شده، یا صفحهٔ عمومی: نمایش داده نمی‌شود
  if (!isAuthenticated || pathname.startsWith("/admin") || isPublicPage) return null;

  const fabsVisible = openChat === null;

  return (
    <>
      {/* پس‌زمینهٔ محو هنگام بازبودنِ خوشه (فقط PRO) — DECISION-125 */}
      {isPro && (
        <div
          aria-hidden
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-30 bg-black/15"
          style={{
            opacity: expanded ? 1 : 0,
            visibility: expanded ? "visible" : "hidden",
            pointerEvents: expanded ? "auto" : "none",
            backdropFilter: expanded ? "blur(2px)" : "none",
            transition: "opacity 300ms ease, visibility 300ms",
          }}
        />
      )}

      {/* خوشهٔ FAB — یک پلاسِ شیشه‌ای که با لمس به چت‌ها گسترش می‌یابد. پنهان وقتی چتی باز است. */}
      <div
        className="fixed right-6 z-40 flex flex-col items-center gap-3.5
                   bottom-[calc(5.25rem+env(safe-area-inset-bottom))] md:bottom-6"
        style={{
          opacity: fabsVisible ? undefined : 0,
          pointerEvents: fabsVisible ? "auto" : "none",
          transition: "opacity 250ms ease",
        }}
      >
        {/* اکشن‌های PRO — با spring از پلاس بیرون می‌جهند */}
        {isPro && (
          <>
            <div
              className="relative"
              style={{
                opacity: expanded ? 1 : 0,
                transform: expanded ? "translateY(0) scale(1)" : "translateY(16px) scale(0.6)",
                pointerEvents: expanded ? "auto" : "none",
                transition: "transform 420ms cubic-bezier(0.34,1.5,0.5,1) 60ms, opacity 220ms ease 60ms",
              }}
            >
              <button
                type="button"
                onClick={() => openChatAndCollapse("support")}
                aria-label="پشتیبانی آنلاین همسو"
                // رنگِ بژ/طلاییِ پشتیبانی (نه سفید) — شیشه‌ایِ تینت‌دار (DECISION-126)
                className="fab-glass w-12 h-12 rounded-full flex items-center justify-center text-gold"
                style={{ background: "rgba(193,154,74,0.22)" }}
              >
                <HeadsetIcon />
              </button>
              <span className="fab-pill absolute right-full mr-2.5 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-medium text-ink whitespace-nowrap">پشتیبانیِ آنلاین</span>
              {unread > 0 && (
                <span className="absolute -top-1 -left-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-ember text-paper text-[10px] font-bold flex items-center justify-center fa-num shadow-paper-sm">
                  {unread > 9 ? toFaDigits("9+") : toFaDigits(String(unread))}
                </span>
              )}
              {supportOnline && (
                <span aria-hidden className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-paper bg-sage" />
              )}
            </div>

            <div
              className="relative"
              style={{
                opacity: expanded ? 1 : 0,
                transform: expanded ? "translateY(0) scale(1)" : "translateY(16px) scale(0.6)",
                pointerEvents: expanded ? "auto" : "none",
                transition: "transform 420ms cubic-bezier(0.34,1.5,0.5,1) 110ms, opacity 220ms ease 110ms",
              }}
            >
              <button
                type="button"
                onClick={() => openChatAndCollapse("companion")}
                aria-label="گفتگو با همدم"
                className="fab-glass w-12 h-12 rounded-full flex items-center justify-center text-ink"
              >
                <BubbleIcon />
              </button>
              <span className="fab-pill absolute right-full mr-2.5 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-medium text-ink whitespace-nowrap">گفتگو با همدم</span>
            </div>
          </>
        )}

        {/* دکمهٔ اصلی — پلاسِ شیشه‌ای (PRO) یا حبابِ همدم (رایگان) */}
        <button
          type="button"
          onClick={onMainTap}
          aria-label={isPro ? (expanded ? "بستن" : "چت") : "گفتگو با همدم"}
          aria-expanded={isPro ? expanded : undefined}
          className="chat-fab fab-glass relative w-14 h-14 rounded-full flex items-center justify-center text-ink"
        >
          {isPro ? <PlusIcon expanded={expanded} /> : <BubbleIcon />}
          {isPro && !expanded && unread > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-ember text-paper text-[10px] font-bold flex items-center justify-center fa-num shadow-paper-sm">
              {unread > 9 ? toFaDigits("9+") : toFaDigits(String(unread))}
            </span>
          )}
        </button>
      </div>

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

function PlusIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden
      style={{ transform: expanded ? "rotate(135deg)" : "rotate(0deg)", transition: "transform 420ms cubic-bezier(0.34,1.5,0.5,1)" }}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
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
