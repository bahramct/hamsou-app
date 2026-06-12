"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ContactForm — فرم «تماس با ما» با کپچای اختصاصی همسو (DECISION-072)
// کپچا: SVG سمت سرور (ارقام فارسی + نویز) + توکن HMAC؛ بدون هیچ سرویس خارجی.
// متن دکمه هنگام ارسال ثابت می‌ماند (DECISION-053) — فقط Spinner + toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";

interface Captcha {
  token: string;
  svg: string;
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

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const loadCaptcha = useCallback(async () => {
    setAnswer("");
    try {
      const res = await fetch("/api/contact/captcha", { cache: "no-store" });
      const d = await res.json();
      if (d?.ok) setCaptcha({ token: d.token, svg: d.svg });
    } catch {
      // بی‌صدا — با دکمهٔ تازه‌سازی قابل تلاش مجدد است
    }
  }, []);

  useEffect(() => {
    void loadCaptcha();
  }, [loadCaptcha]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!name.trim() || !email.trim() || !body.trim()) {
      toast.error("نام، ایمیل و متن پیام لازم است.");
      return;
    }
    if (!answer.trim()) {
      toast.error("پاسخ کد امنیتی را وارد کن.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          body,
          website,
          captchaToken: captcha?.token ?? "",
          captchaAnswer: answer,
        }),
      });
      const d = await res.json();
      if (res.ok && d?.ok) {
        toast.success(d.message ?? "پیامت رسید. ممنون.");
        setName(""); setEmail(""); setSubject(""); setBody(""); setAnswer("");
        void loadCaptcha();
      } else {
        toast.error(d?.error ?? "ارسال پیام انجام نشد.");
        if (d?.captcha) void loadCaptcha();
      }
    } catch {
      toast.error("ارتباط برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-right">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="نام"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="ایمیل"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, direction: "ltr", textAlign: "right" }}
        />
      </div>

      <input
        type="text"
        placeholder="موضوع (اختیاری)"
        value={subject}
        maxLength={120}
        onChange={(e) => setSubject(e.target.value)}
        style={inputStyle}
      />

      <textarea
        placeholder="پیامت را بنویس…"
        value={body}
        maxLength={4000}
        rows={5}
        onChange={(e) => setBody(e.target.value)}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.8 }}
      />

      {/* کپچای اختصاصی */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl p-3"
        style={{ background: "rgba(var(--rgb-line),0.03)", border: "1px solid rgba(var(--rgb-line),0.08)" }}
      >
        <div
          className="rounded-xl overflow-hidden select-none shrink-0 text-ink"
          style={{ background: "rgba(var(--rgb-card),0.8)", border: "1px solid rgba(var(--rgb-line),0.10)" }}
          aria-hidden
          dangerouslySetInnerHTML={{ __html: captcha?.svg ?? "" }}
        />
        <button
          type="button"
          onClick={() => void loadCaptcha()}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-stone hover:text-ink transition-colors shrink-0"
          style={{ background: "rgba(var(--rgb-line),0.05)", border: "1px solid rgba(var(--rgb-line),0.10)" }}
          aria-label="تازه‌سازی کد امنیتی"
          title="تازه‌سازی کد امنیتی"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
          </svg>
        </button>
        <div className="flex-1 min-w-[140px]">
          <input
            type="text"
            inputMode="numeric"
            placeholder="حاصل جمع؟"
            value={answer}
            maxLength={3}
            onChange={(e) => setAnswer(e.target.value)}
            style={{ ...inputStyle, textAlign: "center" }}
            aria-label="پاسخ کد امنیتی"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn btn-primary"
        style={{ fontSize: "14px", padding: "0.7rem 1.6rem" }}
      >
        {busy && <Spinner size={14} />}
        ارسال پیام
      </button>
    </form>
  );
}
