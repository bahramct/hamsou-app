"use client";

// ─────────────────────────────────────────────────────────────────────────────
// NewTicketForm — فرم ثبت تیکت جدید (DECISION-044)
// موضوع + دسته + اولویت (انتخاب کاربر) + پیام. موفق → هدایت به صفحهٔ همان تیکت.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  DEFAULT_CATEGORY,
  DEFAULT_PRIORITY,
  TICKET_LIMITS,
} from "@/lib/support/tickets";

export function NewTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [priority, setPriority] = useState(DEFAULT_PRIORITY);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    subject.trim().length >= TICKET_LIMITS.subjectMin && message.trim().length >= TICKET_LIMITS.messageMin;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), category, priority, message: message.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "خطا در ثبت تیکت."); return; }
      router.push(`/support/${d.id}`);
    } catch {
      setError("اتصال برقرار نشد.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/8 bg-white/50 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-ink">تیکت جدید</h2>

      {/* ردیف اول: موضوع + دسته */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-stone">موضوع</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={TICKET_LIMITS.subjectMax}
            placeholder="موضوع تیکت را کوتاه بنویس…"
            className={inp}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-stone">دسته</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inp}>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ردیف دوم: اولویت */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-stone">اولویت</label>
        <div className="flex flex-wrap gap-2">
          {TICKET_PRIORITIES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPriority(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                priority === p.key
                  ? PRIORITY_ACTIVE[p.key]
                  : "border-bone text-fog hover:text-stone hover:border-stone/30"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* شرح */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-stone">شرح</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={TICKET_LIMITS.messageMax}
          rows={5}
          placeholder="موضوع را با جزئیات توضیح بده…"
          className={`${inp} resize-y leading-relaxed`}
        />
      </div>

      {error && <p className="text-xs text-ember">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit || busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {busy && <Spinner />}
          ثبت تیکت
        </button>
      </div>
    </form>
  );
}

// رنگ‌بندی دکمه‌های اولویت هنگام active
const PRIORITY_ACTIVE: Record<string, string> = {
  low:    "border-stone/40 bg-black/4 text-stone",
  normal: "border-sage/50 bg-sage/8 text-sage-deep",
  high:   "border-amber-400/50 bg-amber-50 text-amber-700",
  urgent: "border-ember/50 bg-ember/8 text-ember",
};

const inp = "w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage";
