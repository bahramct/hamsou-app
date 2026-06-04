"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SupportChatWindow — پنجرهٔ چت آنلاین پشتیبانی همسو (DECISION-049)
// هم‌خانوادهٔ بصری همدم (slide-up، حباب‌ها، glass) ولی با هویت «پشتیبانی همسو»:
//   • نقطهٔ presence سبز/خاکستری روی آواتار برند
//   • بلوک‌های هیستوریِ روزهای قبل (read-only، زیبا)
//   • دکمهٔ «پاک کردن» (watermark سمت کاربر؛ پنل داده را نگه می‌دارد)
//   • polling تطبیقی پشت لایهٔ نازک chat-transport (قابل‌ارتقا به WebSocket)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import {
  httpSupportChatTransport as transport,
  type SupportChatLoad,
} from "@/lib/support/chat-transport";
import {
  formatWorkingDays,
  type ChatMessageDTO,
  type ChatSessionDTO,
  type SupportChatAvailability,
  type WorkingHours,
} from "@/lib/support/chat";
import { toFaDigits } from "@/lib/utils/digits";

const POLL_INTERVAL_MS = 3000;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** برای پاک‌سازی badge در والد پس از باز شدن */
  onSeen?: () => void;
}

export function SupportChatWindow({ isOpen, onClose, onSeen }: Props) {
  const [history, setHistory] = useState<ChatSessionDTO[]>([]);
  const [today, setToday] = useState<ChatMessageDTO[]>([]);
  const [welcome, setWelcome] = useState<string>("");
  const [availability, setAvailability] = useState<SupportChatAvailability>("offline_hours");
  const [online, setOnline] = useState(false);
  const [hours, setHours] = useState<WorkingHours | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingClear, setPendingClear] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef<string | null>(null); // ISO آخرین پیام امروز
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSend = availability === "online" || availability === "offline_now";

  // ── اعمال یک snapshot کامل ──────────────────────────────────────────────────
  const applyLoad = useCallback((data: SupportChatLoad) => {
    setAvailability(data.availability);
    setOnline(data.online);
    setHours(data.hours);
    setWelcome(data.welcome ?? "");
    const sessions = data.sessions ?? [];
    const todaySession = sessions.find((s) => s.isToday);
    setHistory(sessions.filter((s) => !s.isToday));
    setToday(todaySession?.messages ?? []);
    const last = todaySession?.messages.at(-1);
    cursorRef.current = last?.createdAt ?? null;
  }, []);

  // ── بارگذاری اولیه هنگام باز شدن ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    transport
      .load()
      .then((data) => {
        if (cancelled) return;
        if (!data.allowed) {
          setError("چت آنلاین پشتیبانی برای پلن شما فعال نیست.");
          return;
        }
        applyLoad(data);
        onSeen?.();
      })
      .catch(() => {
        if (!cancelled) setError("ارتباط با سرور برقرار نشد");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, applyLoad, onSeen]);

  // ── polling تطبیقی (متوقف هنگام بسته/مخفی بودن tab) ─────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const pollOnce = async () => {
      try {
        const data = await transport.poll(cursorRef.current);
        if (!data.allowed) return;
        setAvailability(data.availability);
        setOnline(data.online);
        if (data.messages.length > 0) {
          setToday((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = data.messages.filter((m) => !seen.has(m.id));
            if (fresh.length === 0) return prev;
            const merged = [...prev, ...fresh];
            cursorRef.current = merged[merged.length - 1].createdAt;
            return merged;
          });
        }
      } catch {
        // خطای موقت polling — بی‌صدا، دفعهٔ بعد دوباره تلاش
      }
    };

    const start = () => {
      if (pollTimer.current) return;
      pollTimer.current = setInterval(pollOnce, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        void pollOnce();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isOpen]);

  // ── اسکرول به پایین با هر پیام ──────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [today, isSending, history]);

  // ── فوکوس + بستن با Escape ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 420);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", handler);
    };
  }, [isOpen, onClose]);

  // ── ارسال پیام ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending || !canSend) return;

    setInput("");
    setError(null);
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    setToday((prev) => [
      ...prev,
      { id: tempId, authorType: "user", body: text, createdAt: new Date().toISOString() },
    ]);

    const result = await transport.send(text);
    setIsSending(false);

    if (!result.ok) {
      setToday((prev) => prev.filter((m) => m.id !== tempId));
      setError(result.message);
      setInput(text);
      return;
    }
    setToday((prev) => {
      const next = prev.map((m) => (m.id === tempId ? result.message : m));
      cursorRef.current = result.message.createdAt;
      return next;
    });
  }, [input, isSending, canSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  // ── پاک کردن چت (watermark) ─────────────────────────────────────────────────
  const handleClearRequest = async () => {
    if (pendingClear) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setPendingClear(false);
      const ok = await transport.clear();
      if (ok) {
        setHistory([]);
        setToday([]);
        cursorRef.current = null;
      }
      return;
    }
    setPendingClear(true);
    clearTimerRef.current = setTimeout(() => setPendingClear(false), 3000);
  };

  const handleCancelClear = () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    setPendingClear(false);
  };

  const hasAnyMessage = history.length > 0 || today.length > 0;
  const showWelcome = !isLoading && today.length === 0 && welcome;

  // ── متن وضعیت زیر عنوان ─────────────────────────────────────────────────────
  const statusText =
    availability === "online"
      ? "آنلاین — پاسخگوی شما هستیم"
      : availability === "offline_now"
        ? "اکنون در دسترس نیست"
        : availability === "disabled"
          ? "موقتاً غیرفعال"
          : "خارج از ساعت کاری";

  const hoursLine =
    hours && hours.days.length > 0
      ? `پاسخگویی: ${formatWorkingDays(hours.days)}، ${toFaDigits(hours.from)} تا ${toFaDigits(hours.to)}`
      : null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          backdropFilter: isOpen ? "blur(3px)" : "none",
          transition: "opacity 300ms ease",
        }}
      />

      {/* پنل */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="پشتیبانی آنلاین همسو"
        className="fixed bottom-0 right-0 left-0 sm:left-auto sm:right-6 sm:bottom-6 z-50
                   w-full sm:w-95 h-[85dvh] sm:h-155
                   flex flex-col overflow-hidden
                   rounded-t-3xl sm:rounded-3xl
                   bg-paper border border-black/6
                   shadow-[0_-8px_40px_rgba(46,44,40,0.14),0_0_0_1px_rgba(255,255,255,0.6)_inset]"
        style={{
          transform: isOpen ? "translateY(0)" : "translateY(calc(100% + 24px))",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          visibility: isOpen ? "visible" : "hidden",
          transition: "transform 420ms cubic-bezier(0.19,1,0.22,1), opacity 280ms ease",
        }}
      >
        {/* ── هدر ─────────────────────────────────────────────────────────── */}
        <header className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-black/5 bg-paper/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* آواتار برند + نقطهٔ presence */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center shadow-paper-sm">
                <HeadsetIcon />
              </div>
              <span
                aria-hidden
                className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-paper transition-colors"
                style={{ backgroundColor: online ? "var(--color-sage)" : "var(--color-fog)" }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink leading-tight">پشتیبانی همسو</p>
              <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: online ? "var(--color-sage-deep)" : "var(--color-fog)" }}>
                {statusText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isLoading && hasAnyMessage && (
              pendingClear ? (
                <div className="flex items-center gap-0.5 text-[10px]">
                  <span className="text-fog ml-1">پاک شود؟</span>
                  <button
                    type="button"
                    onClick={handleClearRequest}
                    className="px-2 py-1 rounded-full bg-black/8 text-ink hover:bg-black/14 transition-colors font-medium"
                  >
                    بله
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelClear}
                    className="px-2 py-1 rounded-full hover:bg-black/6 text-fog hover:text-stone transition-colors"
                  >
                    نه
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClearRequest}
                  aria-label="پاک کردن گفتگو"
                  title="پاک کردن گفتگو (نزد پشتیبانی محفوظ می‌ماند)"
                  className="w-8 h-8 rounded-full hover:bg-black/6 flex items-center justify-center transition-colors text-fog hover:text-stone"
                >
                  <ClearIcon />
                </button>
              )
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="w-8 h-8 rounded-full bg-black/6 hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── بدنه ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-3 [&::-webkit-scrollbar]:hidden scrollbar-none">
          {isLoading ? (
            <DotLoader />
          ) : error && !hasAnyMessage ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-[12px] text-fog text-center max-w-[80%]">{error}</p>
            </div>
          ) : (
            <>
              {/* هیستوریِ روزهای قبل */}
              {history.map((session) => (
                <HistoryBlock key={session.dayKey} session={session} />
              ))}

              {/* خوش‌آمد (وقتی امروز خالی است) */}
              {showWelcome && <SupportBubble body={welcome} isWelcome />}

              {/* پیام‌های امروز */}
              {today.map((msg) =>
                msg.authorType === "user" ? (
                  <UserBubble key={msg.id} body={msg.body} />
                ) : (
                  <SupportBubble key={msg.id} body={msg.body} />
                )
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── فوتر ────────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-black/5 bg-paper/90 backdrop-blur-sm">
          {/* اطلاع وضعیت وقتی ارسال ممکن نیست */}
          {!canSend && !isLoading && (
            <div className="px-4 pt-2.5 text-center">
              <p className="text-[11px] text-stone">
                {availability === "disabled"
                  ? "چت آنلاین پشتیبانی موقتاً غیرفعال است."
                  : "اکنون خارج از ساعات پاسخگویی هستیم."}
              </p>
              {hoursLine && availability !== "disabled" && (
                <p className="text-[10px] text-fog mt-0.5 fa-num">{hoursLine}</p>
              )}
            </div>
          )}

          {error && hasAnyMessage && (
            <p className="text-[11px] text-ember text-center px-4 pt-2">{error}</p>
          )}

          <div className="flex items-end gap-2 px-3 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending || !canSend}
              placeholder={canSend ? "پیام خود را بنویسید..." : "خارج از ساعت کاری"}
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm text-ink placeholder-fog/70
                         bg-black/5 border border-black/8 focus:border-stone/30
                         outline-none transition-colors leading-relaxed
                         disabled:opacity-40 min-h-10 [&::-webkit-scrollbar]:hidden scrollbar-none"
              style={{ overflow: "hidden" }}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isSending || !canSend}
              aria-label="ارسال"
              className="shrink-0 w-10 h-10 rounded-full bg-ink text-paper
                         flex items-center justify-center transition-all duration-150
                         hover:scale-105 active:scale-95
                         disabled:opacity-25 disabled:cursor-not-allowed disabled:scale-100"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── بلوک هیستوری یک روز ──────────────────────────────────────────────────────
function HistoryBlock({ session }: { session: ChatSessionDTO }) {
  return (
    <div className="animate-fade-up">
      {/* جداکنندهٔ تاریخ */}
      <div className="flex items-center gap-2 my-3" aria-hidden>
        <span className="flex-1 h-px bg-black/8" />
        <span className="text-[10px] text-fog px-2 py-0.5 rounded-full bg-black/4 fa-num">{session.label}</span>
        <span className="flex-1 h-px bg-black/8" />
      </div>
      <div className="space-y-2 opacity-70">
        {session.messages.map((m) =>
          m.authorType === "user" ? (
            <UserBubble key={m.id} body={m.body} />
          ) : (
            <SupportBubble key={m.id} body={m.body} />
          )
        )}
      </div>
    </div>
  );
}

// ─── حباب کاربر ───────────────────────────────────────────────────────────────
function UserBubble({ body }: { body: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-ink text-paper text-sm leading-relaxed whitespace-pre-line">
        {body}
      </div>
    </div>
  );
}

// ─── حباب پشتیبان ─────────────────────────────────────────────────────────────
function SupportBubble({ body, isWelcome = false }: { body: string; isWelcome?: boolean }) {
  return (
    <div className={`flex justify-end ${isWelcome ? "animate-fade-up" : ""}`}>
      <div className="max-w-[82%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white/85 border border-black/8 text-ink text-sm leading-relaxed whitespace-pre-line shadow-paper-sm">
        {body}
      </div>
    </div>
  );
}

// ─── لودر ─────────────────────────────────────────────────────────────────────
function DotLoader() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-fog animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── آیکون‌ها ─────────────────────────────────────────────────────────────────
function HeadsetIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden className="text-paper">
      <path
        d="M4 13a8 8 0 0 1 16 0M4 13v3a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0v3a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
