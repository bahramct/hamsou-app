"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ChatWindow — پنل گفتگو با همدم
// انیمیشن slide-up از پایین
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companionName: string | null;
}

export function ChatWindow({ isOpen, onClose, companionName }: Props) {
  const name = companionName ?? "همدم";

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [dailyCount, setDailyCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(10);
  // متن خوش‌آمد از سرور می‌آید (قابل ویرایش در پنل ادمین — DECISION-037)؛
  // تا قبل از بارگذاری، یک fallback محلی بر اساس نام و سقف نمایش داده می‌شود.
  const [serverWelcome, setServerWelcome] = useState<string | null>(null);
  const welcomeText =
    serverWelcome ??
    `سلام! من ${name} هستم — همراهت در همسو.\nمی‌تونیم روزانه تا ${dailyLimit.toLocaleString("fa-IR")} پیام داشته باشیم و مکالمه‌هامون تا یک ماه می‌مونند.\nبگو، چه خبر؟`;
  const [maxLength, setMaxLength] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasLoaded = useRef(false);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingClear, setPendingClear] = useState(false);

  // بارگذاری/تازه‌سازی در هر باز شدن — تا تغییرات پنل ادمین (متن خوش‌آمد، سقف پیام)
  // بلافاصله اعمال شوند (تعهد پَریتی ادمین↔پروژه). لودر فقط بار اول نمایش داده می‌شود.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const firstLoad = !hasLoaded.current;
    if (firstLoad) setIsLoading(true);
    fetch("/api/chat/messages")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.ok) return;
        hasLoaded.current = true;
        setMessages(data.messages);
        setDailyCount(data.dailyCount);
        setDailyLimit(data.dailyLimit);
        if (typeof data.maxMessageLength === "number") setMaxLength(data.maxMessageLength);
        if (typeof data.welcomeText === "string") setServerWelcome(data.welcomeText);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled && firstLoad) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen]);

  // اسکرول به پایین با هر پیام جدید
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // فوکوس اینپوت هنگام باز شدن
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 420);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // auto-resize textarea با هر تغییر input
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  // بستن با Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    setError(null);
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMsg = {
      id: tempId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setDailyCount((c) => c + 1);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();

      if (!data.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setDailyCount((c) => Math.max(0, c - 1));
        setError(data.message ?? "خطا در ارسال پیام");
        setInput(text);
        return;
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        data.userMessage,
        data.assistantMessage,
      ]);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDailyCount((c) => Math.max(0, c - 1));
      setError("ارتباط با سرور برقرار نشد");
      setInput(text);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleClearRequest = () => {
    if (pendingClear) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setPendingClear(false);
      // ثبت watermark روی سرور — پیام‌های قبلی برای کاربر پنهان می‌شوند (DECISION-052)
      fetch("/api/chat/clear", { method: "POST" }).catch(() => {});
      setMessages([]);
      // hasLoaded ریست می‌شود تا در باز شدن بعدی از سرور خوانده شود
      hasLoaded.current = false;
      return;
    }
    setPendingClear(true);
    clearTimerRef.current = setTimeout(() => setPendingClear(false), 3000);
  };

  const handleCancelClear = () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    setPendingClear(false);
  };

  const remaining = dailyLimit - dailyCount;
  const isAtLimit = remaining <= 0;
  const showWelcome = !isLoading && messages.length === 0;

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

      {/* پنل اصلی */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`گفتگو با ${name}`}
        className="fixed bottom-0 right-0 left-0 sm:left-auto sm:right-6 sm:bottom-6 z-50
                   w-full sm:w-95 h-[85dvh] sm:h-155 sm:max-h-[calc(100dvh-2rem)]
                   flex flex-col overflow-hidden
                   rounded-t-3xl sm:rounded-3xl
                   bg-paper border border-black/6
                   shadow-[0_-8px_40px_rgba(46,44,40,0.14),0_0_0_1px_rgba(var(--rgb-card),0.6)_inset]"
        style={{
          transform: isOpen ? "translateY(0)" : "translateY(calc(100% + 24px))",
          opacity: isOpen ? 1 : 0.6,
          transition:
            "transform 420ms cubic-bezier(0.19,1,0.22,1), opacity 280ms ease",
        }}
      >
        {/* ── هدر ──────────────────────────────────────────────────────── */}
        <header className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-black/5 bg-paper/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* آواتار */}
            <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center shrink-0 shadow-paper-sm">
              <span className="text-paper text-sm font-semibold leading-none">
                {name[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink leading-tight">{name}</p>
              <p className="text-[10px] text-fog mt-0.5">همراه همسو</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* دکمه پاک کردن — فقط اگر پیامی وجود دارد */}
            {!isLoading && messages.length > 0 && (
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
                  aria-label="پاک کردن تاریخچه"
                  title="پاک کردن تاریخچه چت"
                  className="w-8 h-8 rounded-full hover:bg-black/6 flex items-center justify-center transition-colors text-fog hover:text-stone"
                >
                  <ClearIcon />
                </button>
              )
            )}
            {/* دکمه بستن */}
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن گفتگو"
              className="w-8 h-8 rounded-full bg-black/6 hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* ── لیست پیام‌ها ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-3 [&::-webkit-scrollbar]:hidden scrollbar-none">
          {isLoading ? (
            <DotLoader />
          ) : (
            <>
              {showWelcome && <AssistantBubble content={welcomeText} isWelcome />}
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <UserBubble key={msg.id} content={msg.content} />
                ) : (
                  <AssistantBubble key={msg.id} content={msg.content} />
                )
              )}
              {isSending && <TypingDots />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── فوتر ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-black/5 bg-paper/90 backdrop-blur-sm">
          {/* نمایش rate limit */}
          {(isAtLimit || (!isAtLimit && remaining <= 3)) && (
            <div className="px-4 pt-2">
              <p className="text-[10px] text-center fa-num text-fog">
                {isAtLimit
                  ? "محدودیت روزانه تمام شد — فردا ادامه می‌دهیم"
                  : `${remaining.toLocaleString("fa-IR")} پیام امروز باقی مانده`}
              </p>
            </div>
          )}

          {error && (
            <p className="text-[11px] text-ember text-center px-4 pt-2">{error}</p>
          )}

          {/* نوار ارسال */}
          <div className="flex items-end gap-2 px-3 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isSending || isAtLimit}
              placeholder={isAtLimit ? "فردا ادامه می‌دهیم" : "بنویس..."}
              rows={1}
              maxLength={maxLength}
              className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm text-ink placeholder-fog/70
                         bg-black/5 border border-black/8 focus:border-stone/30
                         outline-none transition-colors leading-relaxed
                         disabled:opacity-40 min-h-10 max-h-24 [&::-webkit-scrollbar]:hidden scrollbar-none"
              style={{ overflowY: "auto" }}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isSending || isAtLimit}
              aria-label="ارسال پیام"
              className="shrink-0 w-10 h-10 rounded-full bg-ink text-paper
                         flex items-center justify-center
                         transition-all duration-150
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

// ─── پیام کاربر ──────────────────────────────────────────────────────────────
function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-ink text-paper text-sm leading-relaxed whitespace-pre-line">
        {content}
      </div>
    </div>
  );
}

// ─── پیام دستیار ─────────────────────────────────────────────────────────────
function AssistantBubble({
  content,
  isWelcome = false,
}: {
  content: string;
  isWelcome?: boolean;
}) {
  return (
    <div className={`flex justify-end ${isWelcome ? "animate-fade-up" : ""}`}>
      <div className="max-w-[82%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white/85 border border-black/8 text-ink text-sm leading-relaxed whitespace-pre-line shadow-paper-sm">
        {content}
      </div>
    </div>
  );
}

// ─── انیمیشن تایپ ────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex justify-end">
      <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-white/85 border border-black/8 shadow-paper-sm flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-stone/50 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── لودینگ اولیه ────────────────────────────────────────────────────────────
function DotLoader() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-fog animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── آیکون ارسال ─────────────────────────────────────────────────────────────
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── آیکون پاک کردن ──────────────────────────────────────────────────────────
function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
