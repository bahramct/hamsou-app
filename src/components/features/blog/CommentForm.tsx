"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import { COMMENT_MAX_LEN, COMMENT_NAME_MAX_LEN } from "@/lib/blog/constants";

// فرمِ کامنت — هم برای کامنتِ ریشه و هم پاسخ (با parentId). متنِ دکمه ثابت می‌ماند
// (DECISION-053)؛ فقط Spinner و toast. کامنت پس از تأییدِ ادمین نمایش داده می‌شود.
export function CommentForm({
  slug,
  parentId,
  onDone,
  onCancel,
  compact = false,
}: {
  slug: string;
  parentId?: string;
  onDone?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!name.trim() || !email.trim() || !body.trim()) {
      toast.error("نام، ایمیل و متنِ کامنت لازم است.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, body, parentId, website }),
      });
      const d = await res.json();
      if (res.ok && d?.ok) {
        toast.success(d.message ?? "کامنتت ثبت شد و پس از تأیید نمایش داده می‌شود.");
        setName("");
        setEmail("");
        setBody("");
        onDone?.();
      } else {
        toast.error(d?.error ?? "ثبتِ کامنت انجام نشد.");
      }
    } catch {
      toast.error("ارتباط برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.6)",
    border: "1px solid rgba(26,26,31,0.10)",
    borderRadius: "12px",
    padding: "0.7rem 0.9rem",
    fontSize: "14px",
    fontWeight: 300,
    color: "var(--color-ink)",
    outline: "none",
  };

  return (
    <form onSubmit={submit} className={compact ? "space-y-2.5" : "space-y-3"}>
      {/* honeypot — مخفی از کاربر، طعمهٔ ربات */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        aria-hidden
      />

      <div className={compact ? "" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        <input
          type="text"
          placeholder="نام"
          value={name}
          maxLength={COMMENT_NAME_MAX_LEN}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        {!compact && (
          <input
            type="email"
            placeholder="ایمیل (نمایش داده نمی‌شود)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, direction: "ltr", textAlign: "right" }}
          />
        )}
      </div>

      {compact && (
        <input
          type="email"
          placeholder="ایمیل (نمایش داده نمی‌شود)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, direction: "ltr", textAlign: "right" }}
        />
      )}

      <textarea
        placeholder={parentId ? "پاسخت را بنویس…" : "کامنتت را بنویس…"}
        value={body}
        maxLength={COMMENT_MAX_LEN}
        onChange={(e) => setBody(e.target.value)}
        rows={compact ? 3 : 4}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.8 }}
      />

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
          style={{ fontSize: "14px", padding: "0.6rem 1.4rem" }}
        >
          {busy && <Spinner size={14} />}
          {parentId ? "ثبتِ پاسخ" : "ثبتِ کامنت"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
            style={{ fontSize: "13px", padding: "0.6rem 1.1rem" }}
          >
            انصراف
          </button>
        )}
      </div>
    </form>
  );
}
