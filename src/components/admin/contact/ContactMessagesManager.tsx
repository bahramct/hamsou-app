"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ContactMessagesManager — مدیریت پیام‌های فرم تماس در پنل (DECISION-072/079)
// • کارت‌ها دو‌ستونه و تقریباً مربعی؛ کلیک روی کارت → مودالِ متنِ کامل.
// • «مشاهده شد» → انتقال به تبِ خوانده‌شده. «پاسخ» → باکسِ متنی → ارسال با ایمیل
//   (hello@hamsouapp.ir) به فرستنده. متنِ دکمه‌ها هنگام اکشن ثابت (DECISION-053).
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

  const countOf = (t: Tab) =>
    t === "all" ? messages.length : messages.filter((m) => m.status === t).length;

  const visible = tab === "all" ? messages : messages.filter((m) => m.status === tab);
  const openMsg = openId ? messages.find((m) => m.id === openId) ?? null : null;

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
      if (action === "archive") setOpenId(null);
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
      setOpenId(null);
    } catch {
      toast.error("ارتباط برقرار نشد.");
    } finally {
      setBusyId(null);
    }
  }

  // پاسخ موفق در سرور پیام را خوانده‌شده می‌کند → state را هم‌تراز کن.
  function onReplied(id: string) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id && m.status === "new" ? { ...m, status: "read" } : m))
    );
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

      {/* شبکهٔ کارت‌ها — دو ستون، تقریباً مربعی */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-black/8 bg-white/40 px-5 py-12 text-center">
          <p className="text-xs text-fog">پیامی در این وضعیت نیست.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map((m) => (
            <MessageCard key={m.id} m={m} onOpen={() => setOpenId(m.id)} />
          ))}
        </div>
      )}

      {/* مودالِ متنِ کامل + اکشن‌ها */}
      {openMsg && (
        <MessageModal
          m={openMsg}
          busy={busyId === openMsg.id}
          canDelete={canDelete}
          onClose={() => setOpenId(null)}
          onPatch={patch}
          onRemove={remove}
          onReplied={onReplied}
        />
      )}
    </div>
  );
}

// ─── کارتِ مربعیِ پیام ────────────────────────────────────────────────────────
function MessageCard({ m, onOpen }: { m: ContactMessageRow; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-right rounded-2xl border border-black/8 bg-white/45 p-5 flex flex-col gap-2 hover:bg-white/70 hover:border-black/12 transition-colors min-h-[180px]"
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            m.status === "new" ? "bg-ember" : m.status === "archived" ? "bg-fog/40" : "bg-sage/70"
          }`}
          aria-hidden
        />
        <span className={`text-sm ${m.status === "new" ? "font-semibold text-ink" : "text-ink"}`}>
          {m.name}
        </span>
        <span className="text-[10px] text-fog/70 fa-num mr-auto">{faDateTime(m.createdAt)}</span>
      </div>
      {m.subject && <div className="text-xs font-medium text-stone truncate">{m.subject}</div>}
      <p
        className="text-xs text-stone/90 flex-1"
        style={{
          lineHeight: 1.85,
          display: "-webkit-box",
          WebkitLineClamp: 5,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {m.body}
      </p>
      <span className="text-[11px] text-sage-deep">باز کردن ←</span>
    </button>
  );
}

// ─── مودالِ متنِ کامل ─────────────────────────────────────────────────────────
function MessageModal({
  m,
  busy,
  canDelete,
  onClose,
  onPatch,
  onRemove,
  onReplied,
}: {
  m: ContactMessageRow;
  busy: boolean;
  canDelete: boolean;
  onClose: () => void;
  onPatch: (id: string, action: "read" | "unread" | "archive") => void;
  onRemove: (id: string) => void;
  onReplied: (id: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function sendReply() {
    if (replyBusy) return;
    if (!replyBody.trim()) {
      toast.error("متنِ پاسخ را بنویس.");
      return;
    }
    setReplyBusy(true);
    try {
      const res = await fetch(`/api/admin/contact/${m.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody }),
      });
      const d = await res.json();
      if (res.ok && d?.ok) {
        toast.success("پاسخ با ایمیل ارسال شد.");
        onReplied(m.id);
        setReplying(false);
        setReplyBody("");
      } else {
        toast.error(d?.error ?? "ارسالِ پاسخ انجام نشد.");
      }
    } catch {
      toast.error("ارتباط برقرار نشد.");
    } finally {
      setReplyBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-paper border border-black/10 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* سرتیتر */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="text-base font-semibold text-ink">{m.name}</div>
            <div className="text-[11px] text-fog num-latin mt-0.5" dir="ltr">{m.email}</div>
            {m.subject && <div className="text-xs text-stone mt-1">{m.subject}</div>}
            <div className="text-[11px] text-fog/70 fa-num mt-1">{faDateTime(m.createdAt)}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="p-1.5 rounded-lg text-stone hover:bg-black/5 shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* متنِ کامل */}
        <p
          className="text-sm text-stone rounded-xl px-4 py-3 mb-4"
          style={{ background: "rgba(0,0,0,0.025)", lineHeight: 1.95, whiteSpace: "pre-wrap" }}
        >
          {m.body}
        </p>

        {/* باکسِ پاسخ */}
        {replying && (
          <div className="mb-4 rounded-xl border border-sage/25 bg-sage/5 p-3">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={5}
              placeholder="پاسختان را بنویسید… (با ایمیلِ hello@hamsouapp.ir ارسال می‌شود)"
              className="w-full bg-white/60 border border-black/10 rounded-lg px-3 py-2 text-sm text-ink outline-none resize-y"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={sendReply}
                disabled={replyBusy}
                className="btn btn-primary"
                style={{ fontSize: "13px", padding: "0.45rem 1rem" }}
              >
                {replyBusy && <Spinner size={13} />}
                ارسال پاسخ
              </button>
              <button
                onClick={() => setReplying(false)}
                className="text-xs px-3 py-1.5 rounded-lg text-stone hover:bg-black/5"
              >
                انصراف
              </button>
            </div>
          </div>
        )}

        {/* اکشن‌ها */}
        <div className="flex items-center gap-2 flex-wrap">
          {!replying && (
            <button
              onClick={() => setReplying(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-ink text-paper hover:bg-charcoal transition-colors"
            >
              پاسخ
            </button>
          )}

          {m.status === "new" ? (
            <button
              onClick={() => onPatch(m.id, "read")}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded-lg bg-sage/12 text-sage-deep hover:bg-sage/20 inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              {busy && <Spinner size={11} />}
              مشاهده شد
            </button>
          ) : (
            <button
              onClick={() => onPatch(m.id, "unread")}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded-lg text-stone hover:bg-black/5 inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              {busy && <Spinner size={11} />}
              بازگرداندن به جدید
            </button>
          )}

          {m.status !== "archived" && (
            <button
              onClick={() => onPatch(m.id, "archive")}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded-lg text-stone hover:bg-black/5 inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              {busy && <Spinner size={11} />}
              بایگانی
            </button>
          )}

          {canDelete &&
            (confirmDelete ? (
              <span className="inline-flex items-center gap-1.5 mr-auto">
                <button
                  onClick={() => onRemove(m.id)}
                  disabled={busy}
                  className="text-xs px-3 py-1.5 rounded-lg bg-ember/10 text-ember hover:bg-ember/15 inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  {busy && <Spinner size={11} />}
                  حذف قطعی
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2.5 py-1.5 rounded-lg text-stone hover:bg-black/5"
                >
                  انصراف
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs px-3 py-1.5 rounded-lg text-fog hover:text-ember hover:bg-ember/6 transition-colors mr-auto"
              >
                حذف
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
