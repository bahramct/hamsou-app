"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/notifications/toast";

// نوارِ اشتراک‌گذاری — کپیِ لینکِ کوتاه + اشتراک در تلگرام/واتساپ/ایکس (DECISION-065).
// لینکِ کوتاه: /b/<shortCode>؛ لینکِ اشتراک‌گذاریِ شبکه‌ها: /blog/<slug> کامل.
export function ShareBar({
  slug,
  shortCode,
  title,
}: {
  slug: string;
  shortCode: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  // origin در SSR خالی است — useEffect بعد از hydration مقدار واقعی می‌دهد
  const [siteOrigin, setSiteOrigin] = useState("");

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  const fullUrl = `${siteOrigin}/blog/${slug}`;
  const shortUrl = `${siteOrigin}/b/${shortCode}`;

  async function copyShort() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success("لینکِ کوتاه کپی شد");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("کپی انجام نشد");
    }
  }

  const enc = encodeURIComponent;
  const shares: { key: string; label: string; href: string; icon: React.ReactNode }[] = [
    {
      key: "telegram",
      label: "تلگرام",
      href: `https://t.me/share/url?url=${enc(fullUrl)}&text=${enc(title)}`,
      icon: (
        <path d="M21.5 4.5 2.5 11.8c-.9.3-.9 1.5 0 1.8l4.7 1.5 1.8 5.6c.2.6 1 .8 1.5.3l2.6-2.4 4.9 3.6c.6.4 1.4.1 1.6-.6l3.3-15.8c.2-.9-.7-1.6-1.9-1.3z" />
      ),
    },
    {
      key: "whatsapp",
      label: "واتساپ",
      href: `https://wa.me/?text=${enc(title + " " + fullUrl)}`,
      icon: (
        <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.9.9-2.7-.2-.3A8 8 0 1 1 12 20zm4.5-5.9c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.8.8-.9 1.8-.5 3a8.6 8.6 0 0 0 4.6 4.1c1.6.6 2.3.5 2.9.4.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.5-.3z" />
      ),
    },
    {
      key: "x",
      label: "ایکس",
      href: `https://twitter.com/intent/tweet?url=${enc(fullUrl)}&text=${enc(title)}`,
      icon: (
        <path d="M18.24 2.25h3.31l-7.23 8.26L23 21.75h-6.63l-4.71-6.23-5.4 6.23H2.95l7.73-8.84L2 2.25h6.83l4.25 5.62 5.16-5.62z" />
      ),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-fog text-sm ml-1" style={{ fontWeight: 300 }}>
        هم‌رسانی:
      </span>

      {shares.map((s) => (
        <a
          key={s.key}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          title={s.label}
          aria-label={s.label}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:-translate-y-0.5"
          style={{ background: "rgba(var(--rgb-line),0.04)", border: "1px solid rgba(var(--rgb-line),0.08)" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="var(--color-stone)" aria-hidden>
            {s.icon}
          </svg>
        </a>
      ))}

      {/* کپیِ لینکِ کوتاه */}
      <button
        onClick={copyShort}
        title="کپیِ لینکِ کوتاه"
        className="inline-flex items-center gap-2 h-9 rounded-full px-3.5 transition-all hover:-translate-y-0.5"
        style={{
          background: copied ? "rgba(122,132,113,0.10)" : "rgba(var(--rgb-line),0.04)",
          border: `1px solid ${copied ? "rgba(122,132,113,0.22)" : "rgba(var(--rgb-line),0.08)"}`,
          color: copied ? "var(--color-sage-deep)" : "var(--color-stone)",
        }}
      >
        {copied ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
            <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
          </svg>
        )}
        <span className="text-xs" style={{ fontWeight: 400 }}>لینکِ کوتاه</span>
      </button>
    </div>
  );
}
