"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LiveChatConsole — کنسول چت آنلاین پشتیبانی در پنل (DECISION-049, DECISION-114)
// دو-پنل: صفِ گفتگوها (poll ~۵ث) + نمای گفتگوی انتخاب‌شده (poll ~۳ث) + کادر پاسخ.
// heartbeat (~۳۰ث) حضور پشتیبان را تازه نگه می‌دارد → نقطهٔ سبز در چت کاربر.
// ادمین «همهٔ» پیام‌ها را می‌بیند؛ خط watermark نشان می‌دهد کاربر تا کجا را مخفی کرده.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AVATAR_COLOR } from "@/lib/profile/avatarPresets";
import { toFaDigits } from "@/lib/utils/digits";

const CONV_POLL_MS = 5000;
const DETAIL_POLL_MS = 3000;
const HEARTBEAT_MS = 30000;

interface ConvItem {
  sessionId: string;
  userId: string;
  displayName: string | null;
  phone: string | null;
  avatarPreset: number;
  avatarImage: string | null;
  label: string;
  isToday: boolean;
  lastActivity: string;
  unread: number;
  userHidden: boolean;
}

interface DetailMsg {
  id: string;
  authorType: "user" | "admin";
  authorName: string | null;
  body: string;
  createdAt: string;
}

interface Detail {
  sessionId: string;
  label: string;
  hiddenUntil: string | null;
  user: { id: string; displayName: string | null; phone: string | null; avatarPreset: number; plan: string };
  messages: DetailMsg[];
}

function faTime(iso: string): string {
  return new Date(iso).toLocaleString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tehran",
  });
}

interface Props {
  canRespond: boolean;
}

export function LiveChatConsole({ canRespond }: Props) {
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedId;

  // ── heartbeat حضور ──────────────────────────────────────────────────────────
  useEffect(() => {
    const ping = () => {
      fetch("/api/admin/livechat/heartbeat", { method: "POST" }).catch(() => {});
    };
    ping();
    const t = setInterval(() => {
      if (!document.hidden) ping();
    }, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, []);

  // ── poll صفِ گفتگوها ────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/livechat/conversations", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) {
        setConversations(data.conversations as ConvItem[]);
        setLoadedOnce(true);
      }
    } catch {
      // بی‌صدا
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    const t = setInterval(() => {
      if (!document.hidden) void loadConversations();
    }, CONV_POLL_MS);
    return () => clearInterval(t);
  }, [loadConversations]);

  // ── poll جزئیات گفتگوی انتخاب‌شده ───────────────────────────────────────────
  const loadDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/livechat/conversations/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.ok && selectedRef.current === id) {
        setDetail(data.session as Detail);
      }
    } catch {
      // بی‌صدا
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
    const t = setInterval(() => {
      if (!document.hidden) void loadDetail(selectedId);
    }, DETAIL_POLL_MS);
    return () => clearInterval(t);
  }, [selectedId, loadDetail]);

  // اسکرول پایین با پیام جدید
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages.length]);

  // ── ارسال پاسخ ──────────────────────────────────────────────────────────────
  const sendReply = useCallback(async () => {
    const text = replyInput.trim();
    if (!text || sending || !selectedId) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/livechat/conversations/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.message ?? "ارسال ناموفق بود");
        return;
      }
      setReplyInput("");
      setDetail((prev) =>
        prev ? { ...prev, messages: [...prev.messages, data.message as DetailMsg] } : prev
      );
      void loadConversations();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSending(false);
    }
  }, [replyInput, sending, selectedId, loadConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink">چت آنلاین</h1>
          <p className="text-sm text-stone mt-1 fa-num">
            {toFaDigits(conversations.length)} گفتگو
            {totalUnread > 0 ? ` · ${toFaDigits(totalUnread)} خوانده‌نشده` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] text-sage-deep">
            <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            شما به‌عنوان پشتیبان آنلاین هستید
          </div>
          {canRespond && (
            <Link
              href="/admin/settings/livechat"
              className="text-[11px] px-3 py-1.5 rounded-lg text-stone hover:text-ink hover:bg-black/4 transition-colors"
            >
              تنظیمات چت
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[60vh]">
        {/* ── صفِ گفتگوها ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-black/8 bg-white/40 overflow-hidden flex flex-col max-h-[72vh]">
          <div className="px-4 py-3 border-b border-black/6 text-[11px] text-fog shrink-0">گفتگوها</div>
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {!loadedOnce ? (
              <p className="text-xs text-fog text-center py-10">در حال بارگذاری…</p>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-fog italic text-center py-10">گفتگویی نیست.</p>
            ) : (
              conversations.map((c) => {
                const preset = AVATAR_COLOR;
                const active = c.sessionId === selectedId;
                return (
                  <button
                    key={c.sessionId}
                    type="button"
                    onClick={() => setSelectedId(c.sessionId)}
                    className={`w-full text-right flex items-center gap-3 px-4 py-3 border-b border-black/4 last:border-0 transition-colors ${
                      active ? "bg-ink/6" : "hover:bg-black/3"
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden"
                      style={c.avatarImage ? undefined : { backgroundColor: preset.bg, color: preset.fg }}
                    >
                      {c.avatarImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatarImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (c.displayName?.trim()?.[0]) ?? "ه"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-ink truncate">{c.displayName || "کاربر"}</span>
                        {c.isToday && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sage/15 text-sage-deep shrink-0">امروز</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-fog fa-num">{c.label}</span>
                        {c.userHidden && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/5 text-fog shrink-0" title="کاربر این گفتگو را نزد خود مخفی کرده">
                            مخفی‌شده نزد کاربر
                          </span>
                        )}
                      </div>
                    </div>
                    {c.unread > 0 && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-ember text-paper text-[10px] font-bold flex items-center justify-center fa-num shrink-0">
                        {toFaDigits(c.unread)}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── نمای گفتگو ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-black/8 bg-white/40 overflow-hidden flex flex-col max-h-[72vh]">
          {!detail ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-fog">یک گفتگو را از صف انتخاب کن.</p>
            </div>
          ) : (
            <>
              {/* هدر گفتگو */}
              <ConvHeader detail={detail} />

              {/* پیام‌ها */}
              <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-3">
                {detail.messages.map((m, i) => (
                  <div key={m.id}>
                    <WatermarkDivider
                      prev={detail.messages[i - 1]?.createdAt ?? null}
                      curr={m.createdAt}
                      hiddenUntil={detail.hiddenUntil}
                    />
                    <MsgBubble msg={m} />
                  </div>
                ))}
                {/* اگر watermark بعد از آخرین پیام بود */}
                <TrailingWatermark
                  lastAt={detail.messages.at(-1)?.createdAt ?? null}
                  hiddenUntil={detail.hiddenUntil}
                />
                <div ref={bottomRef} />
              </div>

              {/* کادر پاسخ */}
              {(() => {
                const lastMsgAt = detail.messages.at(-1)?.createdAt ?? null;
                const isSessionHidden = !!(detail.hiddenUntil && lastMsgAt &&
                  new Date(detail.hiddenUntil).getTime() >= new Date(lastMsgAt).getTime());
                if (!canRespond) {
                  return (
                    <div className="shrink-0 border-t border-black/6 p-3 text-center">
                      <p className="text-[11px] text-fog">برای پاسخ‌دادن به دسترسی «پاسخ به تیکت‌ها» نیاز است.</p>
                    </div>
                  );
                }
                return (
                  <div className="shrink-0 border-t border-black/6 p-3">
                    {error && <p className="text-[11px] text-ember text-center pb-2">{error}</p>}
                    <div className={`flex items-end gap-2 ${isSessionHidden ? "opacity-40 pointer-events-none" : ""}`}>
                      <textarea
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void sendReply();
                          }
                        }}
                        disabled={sending || isSessionHidden}
                        placeholder="پاسخ خود را بنویس…"
                        rows={1}
                        maxLength={2000}
                        className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage min-h-10"
                      />
                      <button
                        type="button"
                        onClick={() => void sendReply()}
                        disabled={!replyInput.trim() || sending || isSessionHidden}
                        className="shrink-0 px-4 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-30"
                      >
                        ارسال
                      </button>
                    </div>
                    {isSessionHidden && (
                      <p className="text-[10px] text-fog text-center mt-2">
                        کاربر این گفتگو را نزد خود مخفی کرده — پاسخ در حال حاضر غیرفعال است
                      </p>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── هدر گفتگو ────────────────────────────────────────────────────────────────
function ConvHeader({ detail }: { detail: Detail }) {
  const preset = AVATAR_COLOR;
  return (
    <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-black/6 bg-white/50">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
        style={{ backgroundColor: preset.bg, color: preset.fg }}
      >
        {(detail.user.displayName?.trim()?.[0]) ?? "ه"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink truncate">{detail.user.displayName || "کاربر"}</div>
        <div className="text-[10px] text-fog" dir="ltr">{detail.user.phone ? toFaDigits(detail.user.phone) : "—"}</div>
      </div>
      <span className="text-[10px] text-fog fa-num shrink-0">{detail.label}</span>
    </div>
  );
}

// ─── حباب پیام ────────────────────────────────────────────────────────────────
function MsgBubble({ msg }: { msg: DetailMsg }) {
  const isAdmin = msg.authorType === "admin";
  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
        isAdmin
          ? "bg-ink text-paper rounded-tl-sm"
          : "bg-white/85 border border-black/8 text-ink rounded-tr-sm"
      }`}>
        {isAdmin && msg.authorName && (
          <div className="text-[9px] opacity-60 mb-0.5">{msg.authorName}</div>
        )}
        {msg.body}
        <div className={`text-[9px] mt-1 fa-num ${isAdmin ? "text-paper/50" : "text-fog"}`}>{faTime(msg.createdAt)}</div>
      </div>
    </div>
  );
}

// ─── خط watermark بین دو پیام ────────────────────────────────────────────────
function WatermarkDivider({
  prev,
  curr,
  hiddenUntil,
}: {
  prev: string | null;
  curr: string;
  hiddenUntil: string | null;
}) {
  if (!hiddenUntil) return null;
  const wm = new Date(hiddenUntil).getTime();
  const c = new Date(curr).getTime();
  const p = prev ? new Date(prev).getTime() : -Infinity;
  // watermark بین پیام قبلی و این پیام افتاده است
  if (wm >= c || wm < p) return null;
  return <HiddenLine />;
}

function TrailingWatermark({ lastAt, hiddenUntil }: { lastAt: string | null; hiddenUntil: string | null }) {
  if (!hiddenUntil || !lastAt) return null;
  const wm = new Date(hiddenUntil).getTime();
  if (wm < new Date(lastAt).getTime()) return null;
  return <HiddenLine />;
}

function HiddenLine() {
  return (
    <div className="flex items-center gap-2 my-2" aria-hidden>
      <span className="flex-1 h-px bg-fog/30" />
      <span className="text-[9px] text-fog px-2">کاربر تا این‌جا را نزد خود مخفی کرد</span>
      <span className="flex-1 h-px bg-fog/30" />
    </div>
  );
}
