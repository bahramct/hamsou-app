"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ReplyForm — پاسخ کاربر در یک تیکت (DECISION-044). موفق → refresh رشتهٔ پیام‌ها.
// تیکت بسته هم قابل پاسخ است (سرور آن را بازگشایی می‌کند).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TICKET_LIMITS } from "@/lib/support/tickets";
import { toast } from "@/lib/notifications/toast";

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = message.trim();
    if (body.length < TICKET_LIMITS.messageMin || busy) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "خطا در ارسال پاسخ."); return; }
      setMessage("");
      toast.success("پاسخ ثبت شد");
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={TICKET_LIMITS.messageMax}
        rows={3}
        placeholder="پاسخ خود را بنویس…"
        className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage resize-y leading-relaxed"
      />
      {error && <p className="text-xs text-ember">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={message.trim().length < TICKET_LIMITS.messageMin || busy}
          className="px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {busy ? "در حال ارسال…" : "ارسال پاسخ"}
        </button>
      </div>
    </form>
  );
}
