"use client";

// ─────────────────────────────────────────────────────────────────────────────
// JourneyRail — ریلِ افقیِ «مسیرت تا اینجا» (TASK-28؛ مو‌به‌موی mockups/goal-journey.html)
// خطِ تختِ تک‌رنگ (طی‌شده sage)، حرکت با دو فلشِ گرمِ محو (نه درگ؛ select-none)،
// نقطهٔ امروز ember+هاله، نشانِ طلاییِ همراه، گوشهٔ طلاییِ استوریِ پُرمتن،
// tooltipِ شناورِ Portal، کلیک → DayDetailModal (از طریقِ onOpen).
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { Portal } from "@/components/ui/Portal";
import type { JourneyNode } from "@/lib/goal/storyboard";

const NODE_W = 64;
const LONG_STORY = 90;

interface TipData { x: number; y: number; below: boolean; gold: boolean; title: string; body: string; hint?: string; }

function fa(n: number): string { return n.toLocaleString("fa-IR"); }
function preview(t: string): string { const s = t.trim(); return s.length > 100 ? `${s.slice(0, 100)}…` : s; }
function isOpenable(n: JourneyNode): boolean { return !n.isFuture && (n.stories.length > 0 || n.insight !== null); }

function Spark({ s = 12 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function JourneyRail({ nodes, onOpen }: { nodes: JourneyNode[]; onOpen: (iso: string) => void }) {
  const vpRef = useRef<HTMLDivElement>(null);
  const centerIdxRef = useRef(0);
  const [showRight, setShowRight] = useState(false);
  const [showLeft, setShowLeft] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [tip, setTip] = useState<TipData | null>(null);

  const todayIndex = nodes.findIndex((n) => n.isToday);
  const doneWidth = Math.max(0, todayIndex) * NODE_W;
  const trackWidth = nodes.length * NODE_W;

  const updateArrows = useCallback(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const slAbs = Math.abs(vp.scrollLeft);
    const max = vp.scrollWidth - vp.clientWidth - 1;
    setOverflow(vp.scrollWidth > vp.clientWidth + 2);
    setShowRight(slAbs > 4);
    setShowLeft(slAbs < max);
  }, []);

  const centerOn = useCallback((iso: string) => {
    const vp = vpRef.current;
    if (!vp) return;
    const el = vp.querySelector<HTMLElement>(`[data-iso="${iso}"]`);
    if (el) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, []);

  useEffect(() => {
    centerIdxRef.current = todayIndex >= 0 ? todayIndex : nodes.length - 1;
    const id = setTimeout(() => {
      const t = nodes[centerIdxRef.current];
      if (t) centerOn(t.iso);
      setTimeout(updateArrows, 380);
    }, 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function step(delta: number) {
    centerIdxRef.current = Math.max(0, Math.min(nodes.length - 1, centerIdxRef.current + delta));
    const t = nodes[centerIdxRef.current];
    if (t) centerOn(t.iso);
    setTip(null);
    setTimeout(updateArrows, 380);
  }

  function nodeTip(e: React.MouseEvent, n: JourneyNode) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top - 8;
    if (n.isFuture) {
      setTip({ x, y, below: false, gold: false, title: `روز ${fa(n.dayNumber)} · هنوز نرسیده`, body: "از این روز می‌توانی بنویسی." });
      return;
    }
    const first = n.stories[0];
    if (first) {
      const more = first.content.trim().length > LONG_STORY || n.insight !== null;
      setTip({
        x, y, below: false, gold: false,
        title: n.isToday ? `امروز · روز ${fa(n.dayNumber)}` : `روز ${fa(n.dayNumber)} · ${n.weekdayLabel}`,
        body: preview(first.content),
        hint: more ? "روی نقطه بزن تا کامل ببینی →" : undefined,
      });
    } else if (n.insight) {
      setTip({ x, y, below: false, gold: false, title: `روز ${fa(n.dayNumber)} · ${n.weekdayLabel}`, body: "این روز استوری ندارد، اما همراه نکته‌ای نوشته.", hint: "روی نقطه بزن →" });
    } else {
      setTip({ x, y, below: false, gold: false, title: n.isToday ? `امروز · روز ${fa(n.dayNumber)}` : `روز ${fa(n.dayNumber)}`, body: n.isToday ? "هنوز ننوشته‌ای — از بالا بنویس." : "خالی ماند." });
    }
  }
  function compTip(e: React.MouseEvent, n: JourneyNode) {
    if (!n.insight) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.bottom + 8, below: true, gold: true, title: n.isToday ? "همراه · امروز" : `همراه · روز ${fa(n.dayNumber)}`, body: preview(n.insight.reflection), hint: "کلیک = خواندنِ کامل" });
  }

  if (nodes.length === 0) {
    return <p className="rounded-2xl border border-bone bg-white/40 px-4 py-6 text-center text-[13px] text-fog">هنوز روزی از مسیرت نگذشته.</p>;
  }

  return (
    <>
      <div className="jp-rail-outer">
        <button type="button" className={`jp-rail-arrow jp-ra-right${showRight ? " show" : ""}`} aria-label="روزهای پیشین" onClick={() => step(-5)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        <div ref={vpRef} onScroll={updateArrows} className={`jp-rail-vp${overflow ? "" : " nomask"}`}>
          <div className="jp-rail-track" style={{ width: trackWidth }}>
            <div className="jp-line" aria-hidden />
            <div className="jp-line-done" aria-hidden style={{ width: doneWidth }} />
            {nodes.map((n) => {
              const openable = isOpenable(n);
              const hasMore = !n.isFuture && (n.stories[0]?.content.trim().length ?? 0) > LONG_STORY;
              const dot = n.isToday ? "today" : n.isFuture ? "future" : "done";
              const pnodeCls = `jp-pnode${n.isToday ? " is-today" : ""}${n.isFuture ? " future" : ""}${hasMore ? " has-more" : ""}`;
              return (
                <div
                  key={n.iso}
                  data-iso={n.iso}
                  className={pnodeCls}
                  style={{ cursor: openable ? "pointer" : "default" }}
                  onMouseEnter={(e) => nodeTip(e, n)}
                  onMouseLeave={() => setTip(null)}
                  onClick={() => { if (openable) onOpen(n.iso); }}
                >
                  <div className={`jp-pdot ${dot}`} />
                  <div className="jp-pday fa-num">{n.isToday ? "امروز" : fa(n.dayNumber)}</div>
                  {n.insight ? (
                    <button
                      type="button"
                      className="jp-cm"
                      aria-label="نشانِ همراه"
                      onMouseEnter={(e) => compTip(e, n)}
                      onMouseLeave={() => setTip(null)}
                      onClick={(e) => { e.stopPropagation(); onOpen(n.iso); }}
                    >
                      <Spark s={12} />
                    </button>
                  ) : (
                    <div className="jp-cm-empty" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button type="button" className={`jp-rail-arrow jp-ra-left${showLeft ? " show" : ""}`} aria-label="روزهای بعد" onClick={() => step(5)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="jp-path-foot">
        <span className="lg"><span className="ds" />روزهای تو</span>
        <span className="lg"><span className="dg"><Spark s={9} /></span>نشانِ همراه</span>
        {overflow && <span className="jp-drag-hint">— با فلش‌ها در مسیر حرکت کن</span>}
      </div>

      {tip && (
        <Portal>
          <div className={`jp-tip${tip.below ? " below" : ""}${tip.gold ? " gold" : ""}`} style={{ left: tip.x, top: tip.y }}>
            <div className="d fa-num">{tip.title}</div>
            <div className="s">{tip.body}</div>
            {tip.hint && <div className="tap">{tip.hint}</div>}
          </div>
        </Portal>
      )}
    </>
  );
}
