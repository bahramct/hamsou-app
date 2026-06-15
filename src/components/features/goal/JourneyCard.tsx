// ─────────────────────────────────────────────────────────────────────────────
// JourneyCard — کارتِ یک مسیرِ گذشته در «کتابخانهٔ مسیرها» (TASK-28؛ مو‌به‌موی
// mockups/goal-journey.html: jcard). کاورِ گرادیانی + موتیف + grain + بَجِ وضعیت،
// بدنهٔ glass با بازهٔ تاریخ، جوهرِ مسیر و شمارشِ روز/استوری/همراه. کلیک → بازخوانی.
// ─────────────────────────────────────────────────────────────────────────────

import type { SerializedJourneyCard } from "@/types/goal";

const COVER: Record<string, string> = {
  goal: "linear-gradient(140deg, rgba(122,132,113,.30), rgba(193,154,74,.16) 70%, rgba(var(--rgb-card),.2))",
  challenge: "linear-gradient(140deg, rgba(199,93,60,.26), rgba(155,180,199,.18) 70%, rgba(var(--rgb-card),.2))",
};

function fa(n: number): string { return n.toLocaleString("fa-IR"); }

function Motif({ challenge }: { challenge: boolean }) {
  if (challenge) {
    return (
      <svg className="motif" width="140" height="140" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="var(--color-ember)" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="motif" width="150" height="150" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 21v-9M12 12c0-5 3.5-8.5 9-8.5C20.8 8.5 17.5 12 12 12Zm0 1.5c0-5-3.5-8.5-9-8.5C3.2 10 6.5 13.5 12 13.5Z" stroke="var(--color-sage-deep)" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function JourneyCard({ card, onOpen }: { card: SerializedJourneyCard; onOpen: () => void }) {
  const isChallenge = card.type === "challenge";
  const isCompleted = card.status === "completed";

  return (
    <button type="button" onClick={onOpen} className="jp-jcard">
      <div className="jp-jcover" style={{ background: COVER[card.type] }}>
        <div className="grain" />
        <Motif challenge={isChallenge} />
        <span className={`jp-status ${isCompleted ? "jp-st-done" : "jp-st-left"}`}>
          {isCompleted ? "به‌پایان رسید" : "نیمه‌رها"}
        </span>
        <h3>{card.title}</h3>
      </div>
      <div className="jp-jbody">
        <span className="jp-jrange fa-num">{card.startLabel} تا {card.endLabel}</span>
        {card.essence ? (
          <span className="jp-jessence">«{card.essence}»</span>
        ) : (
          <span className="jp-jessence" style={{ fontStyle: "italic", color: "var(--color-fog)" }}>بی‌استوری گذشت.</span>
        )}
        <span className="jp-jmeta fa-num">
          <span><b>{fa(card.totalDays)}</b> روز</span>
          <span><b>{fa(card.storyCount)}</b> استوری</span>
          <span><b>{fa(card.insightCount)}</b> همراه</span>
        </span>
      </div>
    </button>
  );
}
