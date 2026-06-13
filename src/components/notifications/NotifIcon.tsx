// ─────────────────────────────────────────────────────────────────────────────
// NotifIcon — آیکن هر نوع اعلان (DECISION-046). نگاشت کلید کاتالوگ → SVG.
// ─────────────────────────────────────────────────────────────────────────────

import type { NotificationIcon } from "@/lib/notifications/catalog";

export function NotifIcon({ icon, className = "" }: { icon: NotificationIcon; className?: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    "aria-hidden": true,
    className,
  } as const;

  switch (icon) {
    case "support":
      return (
        <svg {...common}>
          <path d="M8 1.75A6.25 6.25 0 0 0 1.75 8c0 1 .24 1.95.66 2.78L1.75 14.25l3.6-.64A6.25 6.25 0 1 0 8 1.75Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "plan":
      return (
        <svg {...common}>
          <path d="M2 5.5 8 2.5l6 3-6 3-6-3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M4 7.5v3.2c0 .5 1.8 1.8 4 1.8s4-1.3 4-1.8V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "report":
      return (
        <svg {...common}>
          <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M11 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "goal":
      // پرچمِ مسیر — نشانِ هدف
      return (
        <svg {...common}>
          <path d="M4 2v12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M4 2.75h7l-1.4 2.25L11 7.25H4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 7.25v3.5M8 5.25v.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
  }
}
