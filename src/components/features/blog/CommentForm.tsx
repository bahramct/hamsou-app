"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import { COMMENT_MAX_LEN } from "@/lib/blog/constants";

// فرمِ کامنت — هم برای کامنتِ ریشه و هم پاسخ (با parentId). فقط کاربرِ عضو می‌بیند؛
// هویت (نام/ایمیل) از session می‌آید نه از این فرم (DECISION-079) — پس فقط متن.
// متنِ دکمه ثابت می‌ماند (DECISION-053)؛ فقط Spinner و toast. کامنت پس از تأییدِ
// ادمین برای همه نمایش داده می‌شود؛ تا آن موقع برای خودِ نویسنده gray-out دیده می‌شود.

/** دادهٔ کامنتِ تازه‌ثبت‌شده — برای نمایشِ gray-out تا تأییدِ ادمین. */
export interface SubmittedComment {
  id: string;
  authorName: string;
  body: string;
  parentId: string | null;
  createdAtIso: string;
}

export function CommentForm({
  slug,
  authorName,
  parentId,
  onDone,
  onCancel,
  onSubmitted,
  compact = false,
}: {
  slug: string;
  /** نامِ نمایشیِ کاربرِ لاگین‌کرده — برای gray-outِ کامنتِ خودش. */
  authorName: string;
  parentId?: string;
  onDone?: () => void;
  onCancel?: () => void;
  onSubmitted?: (c: SubmittedComment) => void;
  compact?: boolean;
}) {
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!body.trim()) {
      toast.error("متنِ کامنت لازم است.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId, website }),
      });
      const d = await res.json();
      if (res.ok && d?.ok) {
        toast.success(d.message ?? "کامنتت ثبت شد و پس از تأیید نمایش داده می‌شود.");
        // نمایش gray-out برای خودِ نویسنده تا تأیید ادمین
        if (d.comment?.id && onSubmitted) {
          onSubmitted({
            id: d.comment.id,
            authorName: d.comment.authorName ?? authorName,
            body: d.comment.body ?? body.trim(),
            parentId: d.comment.parentId ?? parentId ?? null,
            createdAtIso: d.comment.createdAtIso ?? new Date().toISOString(),
          });
        }
        setBody("");
        onDone?.();
      } else if (res.status === 401 || d?.requireAuth) {
        toast.error(d?.error ?? "برای ثبت نظر باید عضو همسو شوی.");
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
    background: "rgba(var(--rgb-card),0.6)",
    border: "1px solid rgba(var(--rgb-line),0.10)",
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
