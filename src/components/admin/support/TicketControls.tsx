"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TicketControls — تغییر وضعیت و اولویت تیکت توسط پشتیبان (DECISION-044)
// ذخیره → PATCH. اگر canRespond=false، فقط نمایش (غیرفعال).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TICKET_STATUSES, TICKET_PRIORITIES } from "@/lib/support/tickets";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export function TicketControls({
  ticketId,
  status: initialStatus,
  priority: initialPriority,
  canRespond,
}: {
  ticketId: string;
  status: string;
  priority: string;
  canRespond: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [busy, setBusy] = useState(false);

  const dirty = status !== initialStatus || priority !== initialPriority;

  async function save() {
    if (!dirty || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "خطا در ذخیره."); return; }
      toast.success("تغییرات تیکت ذخیره شد");
      router.refresh();
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-stone">وضعیت</label>
          <select
            value={status}
            disabled={!canRespond}
            onChange={(e) => setStatus(e.target.value)}
            className={ctrl}
          >
            {TICKET_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-stone">اولویت</label>
          <select
            value={priority}
            disabled={!canRespond}
            onChange={(e) => setPriority(e.target.value)}
            className={ctrl}
          >
            {TICKET_PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {canRespond && (
        <button
          onClick={save}
          disabled={!dirty || busy}
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {busy && <Spinner />}
          ذخیرهٔ تغییرات
        </button>
      )}
    </div>
  );
}

const ctrl = "w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage disabled:opacity-60";
