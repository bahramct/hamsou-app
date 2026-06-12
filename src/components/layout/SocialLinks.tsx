// ─────────────────────────────────────────────────────────────────────────────
// SocialLinks — آیکون‌های شبکه‌های اجتماعی همسو (وکتوری، مونوکروم، بدون رنگ برند)
// یک منبع واحد برای فوتر و صفحهٔ تماس (هم‌ترازی). آدرس‌ها بعداً ست می‌شوند (href="#").
// ─────────────────────────────────────────────────────────────────────────────

type SocialItem = { key: string; label: string; href: string; icon: React.ReactNode };

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" />
      <path d="M9 8.5c-.3 1.8 1.2 4.6 3.3 5.9 1 .6 1.9.8 2.5.4l.9-.7c.3-.3.3-.8-.1-1l-1.5-.9c-.3-.2-.6-.1-.8.1l-.4.4c-.9-.4-2.1-1.6-2.4-2.5l.4-.4c.2-.2.3-.5.1-.8l-.8-1.5c-.2-.4-.7-.4-1-.1l-.2.2c-.2.2-.3.5-.3.9Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21.94 4.6 18.9 19.05c-.23 1.01-.83 1.26-1.68.79l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73 8.6-7.77c.37-.33-.08-.52-.58-.19l-10.63 6.7-4.58-1.43c-1-.31-1.01-1 .21-1.48l17.9-6.9c.83-.31 1.56.2 1.29 1.47Z" />
    </svg>
  );
}

export const SOCIAL_ITEMS: SocialItem[] = [
  { key: "twitter", label: "ایکس (توییتر)", href: "#", icon: <XIcon /> },
  { key: "instagram", label: "اینستاگرام", href: "#", icon: <InstagramIcon /> },
  { key: "whatsapp", label: "واتساپ", href: "#", icon: <WhatsAppIcon /> },
  { key: "telegram", label: "تلگرام", href: "#", icon: <TelegramIcon /> },
];

/** ردیف آیکون‌های اجتماعی — مونوکروم؛ روی hover کمی پررنگ می‌شوند. */
export function SocialLinks({ size = "md" }: { size?: "md" | "lg" }) {
  const dim = size === "lg" ? "w-11 h-11" : "w-9 h-9";
  return (
    <div className="flex items-center gap-2">
      {SOCIAL_ITEMS.map((s) => (
        <a
          key={s.key}
          href={s.href}
          aria-label={s.label}
          title={s.label}
          className={`${dim} rounded-full flex items-center justify-center text-stone hover:text-ink transition-all duration-300 hover:-translate-y-0.5`}
          style={{
            background: "rgba(var(--rgb-line),0.05)",
            border: "1px solid rgba(var(--rgb-line),0.10)",
          }}
        >
          {s.icon}
        </a>
      ))}
    </div>
  );
}
