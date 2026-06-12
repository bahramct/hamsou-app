"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ContactMessagesManager — مدیریت پیام‌های فرم تماس در پنل (DECISION-072)
// تب‌های وضعیت (جدید/خوانده/بایگانی) + باز/بسته شدن متن کامل + اکشن‌ها.
// متن دکمه‌ها هنگام اکشن ثابت می‌ماند (DECISION-053) — Spinner + toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { toFaDigits } from "@/lib/utils/digits";

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  body: string;
  status: string; // new | read | archived
  createdAt: string;
}

type Tab = "new" | "read" | "archived" | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "new", label: "جدید" },
  { key: "read", label: "خوانده‌شده" },
  { key: "archived", label: "بایگانی" },
  { key: "all", label: "همه" },
];

function faDateTime(iso: string) {
  return new Date(iso).toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  });
}

export function ContactMessagesManager({
  initialMessages,
  initialCounts,
  canDelete,
}: {
  initialMessages: ContactMessageRow[];
  initialCounts: Record<string, number>;
  canDelete: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [tab, setTab] = useState<Tab>("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const countOf = (t: Tab) =>
    t === "all" ? messages.length : messages.filter((m) => m.status === t || (t === "new" && m.status === "new")).length;

  const visible = tab === "all" ? messages : messages.filter((m) => m.status === (tab === "new" ? "new" : tab));

  async function patch(id: string, action: "read" | "unread" | "archive") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d?.error ?? "انجام نشد.");
        return;
      }
      const next = action === "read" ? "read" : action === "unread" ? "new" : "archived";
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: next } : m)));
      toast.neutral(action === "archive" ? "پیام بایگانی شد." : action === "read" ? "خوانده شد." : "به جدید برگشت.");
    } catch {
      toast.error("ارتباط برقرار نشد.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d?.error ?? "حذف نشد.");
        return;
      }
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.neutral("پیام حذف شد.");
    } catch {
      toast.error("ارتباط برقرار نشد.");
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  }

  // باز کردن پیامِ جدید = خوانده‌شدن خودکار (مثل صندوق ایمیل)
  function toggleOpen(m: ContactMessageRow) {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && m.status === "new") void patch(m.id, "read");
  }

  void initialCounts; // شمارش زنده از state محاسبه می‌شود

  return (
    <div className="space-y-4">
      {/* تب‌ها */}
      <div className="inline-flex rounded-xl border border-black/8 bg-white/40 p-1 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-colors ${
              tab === t.key ? "bg-ink text-paper font-medium" : "text-stone hover:text-ink"
            }`}
          >
            {t.label}
            <span className="fa-num mr-1 opacity-70">({toFaDigits(countOf(t.key))})</span>
          </button>
        ))}
      </div>

      {/* فهرست */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-black/8 bg-white/40 px-5 py-12 text-center">
          <p className="text-xs text-fog">پیامی در این وضعیت نیست.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/8 bg-white/45 overflow-hidden divide-y divide-black/5">
          {visible.map((m) => {
            const open = openId === m.id;
            const busy = busyId === m.id;
            return (
              <div key={m.id} className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => toggleOpen(m)}
                  className="w-full text-right flex items-start gap-3"
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      m.status === "new" ? "bg-ember" : m.status === "archived" ? "bg-fog/40" : "bg-sage/70"
                    }`}
                    aria-hidden
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm ${m.status === "new" ? "font-semibold text-ink" : "text-ink"}`}>
                        {m.name}
                      </span>
                      <span className="text-[11px] text-fog num-latin" dir="ltr">{m.email}</span>
                      <span className="text-[11px] text-fog/70 fa-num mr-auto">{faDateTime(m.createdAt)}</span>
                    </span>
                    <span className="block text-xs text-stone mt-1 truncate">
                      {m.subject ? `${m.subject} — ` : ""}
                      {m.body.slice(0, 110)}
                    </span>
                  </span>
                </button>

                {open && (
                  <div className="mt-3 mr-5 space-y-3">
                    <p
                      className="text-sm text-stone rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(0,0,0,0.025)",
                        lineHeight: 1.9,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.body}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`پاسخ همسو${m.subject ? ` — ${m.subject}` : ""}`)}`}
                        className="text-xs px-3 py-1.5 rounded-lg bg-ink text-paper hover:bg-charcoal transition-colors"
                      >
                        پاسخ با ایمیل
                      </a>
                      {m.status !== "new" ? (
                        <button
                          onClick={() => void patch(m.id, "unread")}
                          disabled={busy}
                          className="text-xs px-3 py-1.5 rounded-lg text-stone hover:bg-black/5 inline-flex items-center gap-1.5 disabled:opacity-40"
                        >
                          {busy && <Spinner size={11} />}
                          علامت‌گذاری به‌عنوان جدید
                        </button>
                      ) : (
                        <button
                          onClick={() => void patch(m.id, "read")}
                          disabled={busy}
                          className="text-xs px-3 py-1.5 rounded-lg text-stone hover:bg-black/5 inline-flex items-center gap-1.5 disabled:opacity-40"
                        >
                          {busy && <Spinner size={11} />}
                          خوانده شد
                        </button>
                      )}
                      {m.status !== "archived" && (
                        <button
                          onClick={() => void patch(m.id, "archive")}
                          disabled={busy}
                          className="text-xs px-3 py-1.5 rounded-lg text-stone hover:bg-black/5 inline-flex items-center gap-1.5 disabled:opacity-40"
                        >
                          {busy && <Spinner size={11} />}
                          بایگانی
                        </button>
                      )}
                      {canDelete &&
                        (confirmDeleteId === m.id ? (
                          <span className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => void remove(m.id)}
                              disabled={busy}
                              className="text-xs px-3 py-1.5 rounded-lg bg-ember/10 text-ember hover:bg-ember/15 inline-flex items-center gap-1.5 disabled:opacity-40"
                            >
                              {busy && <Spinner size={11} />}
                              حذف قطعی
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2.5 py-1.5 rounded-lg text-stone hover:bg-black/5"
                            >
                              انصراف
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(m.id)}
                            className="text-xs px-3 py-1.5 rounded-lg text-fog hover:text-ember hover:bg-ember/6 transition-colors"
                          >
                            حذف
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
