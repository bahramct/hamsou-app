"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SupportCenter — تایلِ «ارتباط با پشتیبانی» + دراورِ کناری (بازطراحی DECISION-096)
// بدونِ صفحهٔ جدا: تیکتِ تازه، فهرستِ گفتگوها و خودِ گفتگو همه در یک دراور.
// همان APIهای موجود را صدا می‌زند (GET/POST tickets، GET/POST messages).
// قواعد: متن دکمه ثابت + Spinner (DECISION-053)، toast (DECISION-046)، مودال/دراورِ
// Portal با body-lock و Escape (modal_design_pattern).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { TICKET_LIMITS } from "@/lib/support/tickets";

export interface TicketSummary {
  id: string;
  subject: string;
  category: string;
  status: string;
  lastMessageAt: string;
}
interface ThreadMessage { id: string; authorType: string; body: string; createdAt: string; }
interface Thread { id: string; subject: string; status: string; category: string; messages: ThreadMessage[]; }

interface Props {
  ticketingAllowed: boolean;
  initialTickets: TicketSummary[];
  /** "tile" = کارت + دراور (پروفایل) · "drawer" = فقط دراور (داشبورد، با رویدادِ سراسری) */
  variant?: "tile" | "drawer";
}

// دستهٔ تیکت — کلیدِ کاتالوگ ↔ برچسبِ کوتاهِ نمایشی (طبق mockup)
const CAT: { key: string; label: string }[] = [
  { key: "technical", label: "فنی" },
  { key: "billing", label: "مالی" },
  { key: "account", label: "حساب" },
  { key: "suggestion", label: "پیشنهاد" },
  { key: "other", label: "سایر" },
];
const catLabel = (k: string) => CAT.find((c) => c.key === k)?.label ?? "سایر";

function statusChip(status: string): { label: string; cls: string } {
  if (status === "answered") return { label: "پاسخ داده شد", cls: "pf-tkst-ans" };
  if (status === "closed") return { label: "بسته شد", cls: "pf-tkst-closed" };
  if (status === "in_progress") return { label: "در حال بررسی", cls: "pf-tkst-open" };
  return { label: "باز", cls: "pf-tkst-open" };
}

function faDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("fa-IR", { day: "numeric", month: "long" }); }
  catch { return iso; }
}
function faDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("fa-IR", { day: "numeric", month: "long" })} · ${d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`;
  } catch { return iso; }
}

export function SupportCenter({ ticketingAllowed, initialTickets, variant = "tile" }: Props) {
  const [tickets, setTickets] = useState<TicketSummary[]>(initialTickets);
  const [open, setOpen] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/support/tickets", { cache: "no-store" });
      if (!res.ok) return;
      const d = (await res.json()) as { tickets: TicketSummary[] };
      setTickets(d.tickets);
    } catch { /* بی‌صدا */ }
  }

  function openDrawer() {
    setOpen(true);
    refresh();
  }

  // ورود از داشبورد با ?support=1 → دراور خودکار باز شود (هم‌پیروی با الگوی کشویی)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("support") !== "1") return;
    const id = requestAnimationFrame(() => openDrawer()); // defer تا setState همگام در افکت نباشد
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // بازکردن از هر صفحه با رویدادِ سراسری (لینکِ «پشتیبانی» در داشبورد، DECISION-102 #1)
  useEffect(() => {
    const handler = () => openDrawer();
    window.addEventListener("open-support-drawer", handler);
    return () => window.removeEventListener("open-support-drawer", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // حالتِ «فقط دراور» (داشبورد): کارت نمایش داده نمی‌شود، فقط دراورِ رویداد-محور
  if (variant === "drawer") {
    return open ? (
      <SupportDrawer
        ticketingAllowed={ticketingAllowed}
        tickets={tickets}
        onClose={() => setOpen(false)}
        onRefresh={refresh}
      />
    ) : null;
  }

  const preview = tickets.slice(0, 2);

  return (
    <section className="pf-tile pf-t-support glass">
      <div className="pf-sup-grid">
        {/* ستونِ راست: سرستون + توضیح + تیکت‌ها */}
        <div className="pf-sup-main">
          <div className="pf-tile-head">
            <div className="pf-tile-ic ic-sup"><HeadsetIcon /></div>
            <div>
              <h3>ارتباط با پشتیبانی</h3>
              <div className="sub">تیکت‌ها و گفتگو با تیم همسو</div>
            </div>
          </div>
          <div className="pf-sup-copy">
            <p>
              سؤال، مشکل یا پیشنهادی داری؟ تیکت بفرست و گفتگو را همین‌جا — بدونِ ترکِ صفحه — دنبال کن.
              تیمِ همسو معمولاً در کمتر از یک روز پاسخ می‌دهد.
            </p>
            {preview.length > 0 && (
              <div className="pf-sup-tickets">
                {preview.map((t) => {
                  const st = statusChip(t.status);
                  return (
                    <button key={t.id} className="pf-sup-tk" onClick={openDrawer}>
                      <div>
                        <div className="s">{t.subject}</div>
                        <div className="m fa-num">{catLabel(t.category)} · {faDate(t.lastMessageAt)}</div>
                      </div>
                      <span className={`pf-tkst ${st.cls}`}>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ستونِ چپ: کادرِ کمک — از بالا هم‌ترازِ سرستون */}
        <div className="pf-sup-side">
          {ticketingAllowed ? (
            <>
              <div className="h">نیاز به کمک داری؟</div>
              <div className="p">تیکتِ تازه باز کن یا گفتگوهای قبلی را در پنلِ کناری مرور کن.</div>
              <button className="pf-btn-primary" onClick={openDrawer}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                تیکت جدید
              </button>
            </>
          ) : (
            <>
              <div className="h">پشتیبانی تیکتی</div>
              <div className="p">ارتباط تیکتی با پشتیبانی بخشی از پلن‌های پلاس و پرو است.</div>
              <Link href="/plans" className="pf-btn-primary" style={{ textDecoration: "none" }}>
                مشاهدهٔ پلن‌ها
              </Link>
            </>
          )}
        </div>
      </div>

      {open && (
        <SupportDrawer
          ticketingAllowed={ticketingAllowed}
          tickets={tickets}
          onClose={() => setOpen(false)}
          onRefresh={refresh}
        />
      )}
    </section>
  );
}

// ─── دراورِ پشتیبانی ───────────────────────────────────────────────────────────
function SupportDrawer({
  ticketingAllowed, tickets, onClose, onRefresh,
}: {
  ticketingAllowed: boolean;
  tickets: TicketSummary[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);

  // compose
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("technical");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // reply
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function openThread(id: string) {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/support/tickets/${id}/messages`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "تیکت بارگذاری نشد."); return; }
      setThread(d.ticket as Thread);
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setLoadingThread(false); }
  }

  const canSubmit =
    subject.trim().length >= TICKET_LIMITS.subjectMin && body.trim().length >= TICKET_LIMITS.messageMin;

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), category, priority: "normal", message: body.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "ثبت تیکت ناموفق بود."); return; }
      toast.success("تیکت ثبت شد");
      setSubject(""); setBody(""); setCategory("technical");
      await onRefresh();
      await openThread(d.id);
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setSending(false); }
  }

  async function submitReply() {
    if (!thread || reply.trim().length < TICKET_LIMITS.messageMin || replying) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/tickets/${thread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "ارسال ناموفق بود."); return; }
      setReply("");
      await openThread(thread.id);
      await onRefresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setReplying(false); }
  }

  return createPortal(
    <>
      <div className="pf-overlay" onClick={onClose} />
      <div className="pf-drawer" role="dialog" aria-modal="true">
        <div className="pf-drawer-head">
          <div className="ic"><HeadsetIcon /></div>
          <div>
            <h3>پشتیبانی همسو</h3>
            <div className="sub">گفتگو و پیگیری — بدونِ ترکِ صفحه</div>
          </div>
          <button className="pf-x-btn" onClick={onClose} aria-label="بستن">×</button>
        </div>

        <div className="pf-drawer-body">
          {thread ? (
            // ── نمای گفتگو ──
            <div className="pf-thread">
              <button className="pf-thread-back" onClick={() => setThread(null)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                بازگشت به فهرست
              </button>
              <div className="pf-list-title" style={{ marginBottom: 16 }}>
                {thread.subject} — <span className={`pf-tkst ${statusChip(thread.status).cls}`}>{statusChip(thread.status).label}</span>
              </div>
              {thread.messages.map((m) => (
                <div key={m.id} className={`pf-msg ${m.authorType === "user" ? "user" : "admin"}`}>
                  <div className="who fa-num">{m.authorType === "user" ? "تو" : "پشتیبانی همسو"} · {faDateTime(m.createdAt)}</div>
                  {m.body}
                </div>
              ))}
              {thread.status === "closed" ? (
                <p className="text-[11px] text-fog text-center mt-auto pt-4">این تیکت بسته شده است. برای موضوع جدید، تیکت تازه‌ای باز کن.</p>
              ) : (
                <div className="pf-thread-foot">
                  <textarea className="pf-inp" rows={1} placeholder="پاسخ بنویس…" value={reply} onChange={(e) => setReply(e.target.value)} />
                  <button className="pf-btn-primary" onClick={submitReply} disabled={replying || reply.trim().length < 1}>
                    {replying && <Spinner size={12} />} ارسال
                  </button>
                </div>
              )}
            </div>
          ) : (
            // ── نمای فهرست + تیکتِ تازه ──
            <div className="pf-tk-list-view">
              {ticketingAllowed ? (
                <form className="pf-compose" onSubmit={submitNew}>
                  <div className="lab">تیکت جدید</div>
                  <input className="pf-inp" placeholder="موضوع را کوتاه بنویس…" value={subject} maxLength={TICKET_LIMITS.subjectMax} onChange={(e) => setSubject(e.target.value)} />
                  <div className="pf-cat-chips">
                    {CAT.map((c) => (
                      <button type="button" key={c.key} className={`pf-chip ${category === c.key ? "active" : ""}`} onClick={() => setCategory(c.key)}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <textarea className="pf-inp" placeholder="توضیح بده چه کمکی از ما برمی‌آید…" value={body} maxLength={TICKET_LIMITS.messageMax} onChange={(e) => setBody(e.target.value)} />
                  <button type="submit" className="pf-btn-primary" style={{ width: "100%" }} disabled={!canSubmit || sending}>
                    {sending && <Spinner size={12} />} ارسال تیکت
                  </button>
                </form>
              ) : (
                <div className="pf-compose" style={{ textAlign: "center" }}>
                  <div className="lab">پشتیبانی تیکتی</div>
                  <p className="text-[11px] text-stone leading-relaxed mb-3">ارتباط تیکتی با پشتیبانی بخشی از پلن‌های پلاس و پرو است.</p>
                  <Link href="/plans" className="pf-btn-primary" style={{ width: "100%", textDecoration: "none" }}>مشاهدهٔ پلن‌ها</Link>
                </div>
              )}

              <div className="pf-list-title">گفتگوهای من</div>
              {tickets.length === 0 ? (
                <p className="text-[12px] text-fog text-center py-6">هنوز تیکتی نداری.</p>
              ) : (
                tickets.map((t) => {
                  const st = statusChip(t.status);
                  return (
                    <button key={t.id} className="pf-tk-card" onClick={() => openThread(t.id)} disabled={loadingThread}>
                      <div>
                        <div className="s">{t.subject}</div>
                        <div className="m fa-num"><span className={`pf-tkst ${st.cls}`}>{st.label}</span> {catLabel(t.category)} · {faDate(t.lastMessageAt)}</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="var(--color-fog)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

function HeadsetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 12a9 9 0 1 0-3.5 7.1L21 21l-1-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
