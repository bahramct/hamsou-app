"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminReplyForm — پاسخ پشتیبان به تیکت (DECISION-044). موفق → refresh.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TICKET_LIMITS } from "@/lib/support/tickets";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export function AdminReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = message.trim();
    if (body.length < TICKET_LIMITS.messageMin || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "خطا در ارسال پاسخ."); return; }
      setMessage("");
      toast.success("پاسخ برای کاربر ارسال شد");
      router.refresh();
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={TICKET_LIMITS.messageMax}
        rows={4}
        placeholder="پاسخ پشتیبانی را بنویس…"
        className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage resize-y leading-relaxed"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={message.trim().length < TICKET_LIMITS.messageMin || busy}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {busy && <Spinner />}
          ارسال پاسخ
        </button>
      </div>
    </form>
  );
}
