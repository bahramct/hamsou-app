"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ChatFAB — دکمه شناور برای باز کردن چت‌بات
// فقط در صفحات authenticated نمایش داده می‌شود (path-based)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChatWindow } from "./ChatWindow";

const PUBLIC_PATHS = ["/", "/login", "/forgot-password", "/verify-email", "/reset-password"];

interface Props {
  companionName?: string | null;
}

export function ChatFAB({ companionName }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // در صفحات عمومی و کل پنل ادمین نمایش داده نمی‌شود (همدم فقط برای کاربر نهایی است)
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* دکمه FAB */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="باز کردن گفتگو با همدم"
        className="fixed bottom-6 right-6 z-40
                   w-14 h-14 rounded-full
                   bg-ink text-paper
                   flex items-center justify-center
                   shadow-[0_4px_20px_rgba(26,26,31,0.28)]
                   hover:shadow-[0_6px_28px_rgba(26,26,31,0.36)]"
        style={{
          opacity: isOpen ? 0 : 1,
          transform: isOpen ? "scale(0.88)" : "scale(1)",
          pointerEvents: isOpen ? "none" : "auto",
          transition: "opacity 250ms ease, transform 300ms cubic-bezier(0.19,1,0.22,1), box-shadow 200ms ease",
        }}
      >
        <BubbleIcon />
      </button>

      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        companionName={companionName ?? null}
      />
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
