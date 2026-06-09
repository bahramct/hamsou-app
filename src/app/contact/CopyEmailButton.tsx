"use client";

import { useState } from "react";
import { toast } from "@/lib/notifications/toast";

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success("آدرس ایمیل کپی شد");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("کپی انجام نشد");
    }
  }

  return (
    <button
      onClick={handleCopy}
      title="کپی ایمیل"
      style={{
        background: copied ? "rgba(122,132,113,0.12)" : "rgba(26,26,31,0.05)",
        border: "1px solid rgba(26,26,31,0.08)",
        borderRadius: "8px",
        padding: "6px 10px",
        cursor: "pointer",
        transition: "all 250ms ease",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "12px",
        color: copied ? "var(--color-sage-deep)" : "var(--color-stone)",
        fontFamily: "inherit",
      }}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      کپی
    </button>
  );
}
