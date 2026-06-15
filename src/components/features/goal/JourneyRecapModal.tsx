"use client";

// ─────────────────────────────────────────────────────────────────────────────
// JourneyRecapModal — «بازخوانیِ سفر» (TASK-28؛ مو‌به‌موی mockups/goal-journey.html: recap)
// کاورِ گرادیانی + نخِ روزها (استوری + بینشِ همراهِ بافته). هدر آنی از card، نخ lazy از
// /api/goal/[id]/recap. الگوی مودال: Portal + قفل + Escape + اسکرولِ بدونِ نوار + انیمیشن.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Portal } from "@/components/ui/Portal";
import { Spinner } from "@/components/ui/Spinner";
import { GoalTypeBadge } from "@/components/features/goal/GoalTypeBadge";
import type { JourneyRecap, SerializedJourneyCard } from "@/types/goal";

const COVER: Record<string, string> = {
  goal: "linear-gradient(140deg, rgba(122,132,113,.22), rgba(193,154,74,.14))",
  challenge: "linear-gradient(140deg, rgba(199,93,60,.20), rgba(155,180,199,.16))",
};

function fa(n: number): string { return n.toLocaleString("fa-IR"); }

function Spark({ s = 13 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function JourneyRecapModal({ card, onClose }: { card: SerializedJourneyCard; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [recap, setRecap] = useState<JourneyRecap | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => { const id = requestAnimationFrame(() => setVisible(true)); return () => cancelAnimationFrame(id); }, []);
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/goal/${card.id}/recap`);
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (res.ok && data.ok) setRecap(data.recap as JourneyRecap);
        else setFailed(true);
      } catch { if (alive) setFailed(true); }
    })();
    return () => { alive = false; };
  }, [card.id]);

  function close() { setVisible(false); setTimeout(onClose, 220); }

  const isCompleted = card.status === "completed";

  return (
    <Portal>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-5"
        style={{ background: "rgba(26,26,31,0.4)", backdropFilter: visible ? "blur(6px)" : "none", opacity: visible ? 1 : 0, transition: "opacity 220ms ease, backdrop-filter 220ms ease" }}
        role="dialog"
        aria-modal="true"
        aria-label={`بازخوانیِ سفر — ${card.title}`}
      >
        <div
          className="jp-recap glass-strong"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(14px) scale(.99)", transition: "opacity 240ms ease, transform 320ms cubic-bezier(0.19,1,0.22,1)" }}
        >
          <div className="jp-scroll">
            <div className="jp-recap-cover" style={{ background: COVER[card.type] }}>
              <button type="button" onClick={close} aria-label="بستن" className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-stone transition-colors hover:bg-white/70 dark:bg-black/25">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              </button>
              <div className="eyebrow" style={{ color: isCompleted ? "var(--color-sage-deep)" : "var(--color-stone)" }}>
                <GoalTypeBadge type={card.type} size="sm" />
                {isCompleted ? "یک مسیرِ به‌پایان‌رسیده" : "یک مسیرِ نیمه‌رها"}
              </div>
              <h2>{card.title}</h2>
              <p className="sub fa-num">
                {card.startLabel} تا {card.endLabel} · {fa(card.totalDays)} روز · {fa(card.storyCount)} استوری
                {card.insightCount > 0 && <> · {fa(card.insightCount)} بازخوردِ همراه</>}
              </p>
            </div>

            <div className="jp-recap-body">
              {!recap && !failed && (
                <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-fog"><Spinner /> در حالِ بازخوانی…</div>
              )}
              {failed && <p className="py-10 text-center text-[13px] text-fog">بازخوانیِ این مسیر ممکن نشد — بعداً دوباره امتحان کن.</p>}
              {recap && recap.days.length === 0 && <p className="py-10 text-center text-[13px] text-fog">از این مسیر نوشته‌ای به‌جا نمانده.</p>}
              {recap && recap.days.map((d, i) => (
                <div key={i} className="jp-thread-day">
                  <div className="dt fa-num">روز {fa(d.dayNumber)} · {d.weekdayLabel} · {d.dateLabel}</div>
                  {d.story && <div className="story">{d.story.content}</div>}
                  {d.insight && (
                    <div className="jp-thread-comp">
                      <div className="h"><Spark s={11} /> همراه نوشت</div>
                      <p>{d.insight.reflection}</p>
                      {d.insight.suggestions.length > 0 && (
                        <ul className="mt-2 space-y-1.5">
                          {d.insight.suggestions.map((sg, k) => (
                            <li key={k} className="flex gap-2 text-[12px] leading-relaxed text-stone">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" /><span>{sg}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
