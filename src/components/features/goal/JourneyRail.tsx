"use client";

// ─────────────────────────────────────────────────────────────────────────────
// JourneyRail — ریلِ افقیِ «مسیرت تا اینجا» — بازطراحیِ DECISION-105
// پیکان‌های زنجیره‌ای RTL: روزِ ۱ در راست، روزِ آخر در چپ
// نشانِ همراه بالای پیکان / حبابِ استوری پایینِ پیکان (فقط اگر محتوا دارد)
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import type { JourneyNode } from "@/lib/goal/storyboard";

const CHEV_W    = 88;             // عرضِ هر پیکان (px)
const CHEV_TIP  = 14;             // عمقِ نوکِ پیکان (px)
// گام برابر عرض = نوکِ پیکانِ قبلی مماسِ انتهایِ بعدی (بدونِ تداخل)
const CHEV_STEP = CHEV_W;
const PREVIEW   = 40;             // حداکثر کاراکترهای حباب

function fa(n: number): string { return n.toLocaleString("fa-IR"); }

function clip(t: string): string {
  const s = t.trim();
  return s.length > PREVIEW ? `${s.slice(0, PREVIEW)}…` : s;
}

function Spark({ s = 11 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function JourneyRail({ nodes, onOpen }: { nodes: JourneyNode[]; onOpen: (iso: string) => void }) {
  const vpRef = useRef<HTMLDivElement>(null);
  const centerIdxRef = useRef(0);
  const [showRight, setShowRight] = useState(false);
  const [showLeft,  setShowLeft]  = useState(false);
  const [overflow,  setOverflow]  = useState(false);

  const todayIndex = nodes.findIndex((n) => n.isToday);
  const len = nodes.length;

  // عرضِ کل track: هر پیکان CHEV_STEP جا می‌گیرد + یک CHEV_W برای آخرین + ۱۶px padding
  const trackWidth = len === 0 ? 0 : CHEV_STEP * (len - 1) + CHEV_W + 16;

  const updateArrows = useCallback(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const sl  = vp.scrollLeft; // direction:ltr → ۰ = چپ (روزِ آخر)، max = راست (روزِ ۱)
    const max = vp.scrollWidth - vp.clientWidth - 1;
    setOverflow(vp.scrollWidth > vp.clientWidth + 2);
    setShowRight(sl < max - 1); // هنوز روزهای پیشین در راست هستند
    setShowLeft(sl > 4);        // هنوز روزهای بعد در چپ هستند
  }, []);

  const centerOn = useCallback((iso: string) => {
    const vp = vpRef.current;
    if (!vp) return;
    const el = vp.querySelector<HTMLElement>(`[data-iso="${iso}"]`);
    if (el) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, []);

  useEffect(() => {
    centerIdxRef.current = todayIndex >= 0 ? todayIndex : len - 1;
    const id = setTimeout(() => {
      const t = nodes[centerIdxRef.current];
      if (t) centerOn(t.iso);
      setTimeout(updateArrows, 380);
    }, 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function step(delta: number) {
    centerIdxRef.current = Math.max(0, Math.min(len - 1, centerIdxRef.current + delta));
    const t = nodes[centerIdxRef.current];
    if (t) centerOn(t.iso);
    setTimeout(updateArrows, 380);
  }

  if (len === 0) {
    return (
      <p className="rounded-2xl border border-bone bg-white/40 px-4 py-6 text-center text-[13px] text-fog">
        هنوز روزی از مسیرت نگذشته.
      </p>
    );
  }

  return (
    <>
      <div className="jp-rail-outer">
        {/* فلشِ راست ← روزهای پیشین */}
        <button
          type="button"
          className={`jp-rail-arrow jp-ra-right${showRight ? " show" : ""}`}
          aria-label="روزهای پیشین"
          onClick={() => step(-5)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div ref={vpRef} onScroll={updateArrows} className={`jp-rail-vp${overflow ? "" : " nomask"}`}>
          <div className="jp-chev-track" style={{ width: trackWidth }}>
            {nodes.map((n, index) => {
              // RTL: روزِ ۱ (index=0) بیشترین x (راست)؛ روزِ آخر (index=len-1) x=8 (چپ)
              const xPos = (len - 1 - index) * CHEV_STEP + 8;
              // روزِ ۱ (index=0) بالاترین z-index تا نوکِ پیکان‌های بعدی از پشتش بیاید بیرون
              const zIdx = len - index;

              const hasStory   = !n.isFuture && n.stories.length > 0;
              const hasInsight = !!n.insight;
              const openable   = !n.isFuture && (n.stories.length > 0 || hasInsight);

              const chevCls = n.isToday   ? "jp-chev jp-chev-today"
                : n.isFuture  ? "jp-chev jp-chev-future"
                : hasStory    ? "jp-chev jp-chev-done"
                :               "jp-chev jp-chev-empty";

              return (
                <div
                  key={n.iso}
                  data-iso={n.iso}
                  className={`jp-cv-wrap${n.isToday ? " jp-cv-today" : ""}`}
                  style={{ left: xPos, zIndex: zIdx }}
                >
                  {/* نشانِ همراه — بالای پیکان */}
                  <div className="jp-cv-top">
                    {hasInsight && (
                      <button
                        type="button"
                        className="jp-cv-cm"
                        aria-label={`همراه · روز ${fa(n.dayNumber)}`}
                        onClick={() => onOpen(n.iso)}
                      >
                        <Spark s={11} />
                      </button>
                    )}
                  </div>

                  {/* شکلِ پیکان */}
                  <div
                    className={chevCls}
                    style={{ cursor: openable ? "pointer" : "default" }}
                    onClick={() => { if (openable) onOpen(n.iso); }}
                  >
                    <span className="jp-cv-lbl fa-num">
                      {n.isToday ? "امروز" : fa(n.dayNumber)}
                    </span>
                  </div>

                  {/* حبابِ استوری — فقط اگر محتوا دارد */}
                  {hasStory && (
                    <div className="jp-cv-bubble" onClick={() => onOpen(n.iso)}>
                      {clip(n.stories[0].content)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* فلشِ چپ ← روزهای بعد */}
        <button
          type="button"
          className={`jp-rail-arrow jp-ra-left${showLeft ? " show" : ""}`}
          aria-label="روزهای بعد"
          onClick={() => step(5)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* راهنما */}
      <div className="jp-path-foot">
        <span className="lg">
          <span className="jp-leg-chev done" aria-hidden />
          <span>روزهای گذشته</span>
        </span>
        <span className="lg">
          <span className="jp-leg-chev today" aria-hidden />
          <span>امروز</span>
        </span>
        <span className="lg">
          <span className="jp-leg-chev future" aria-hidden />
          <span>روزهای آینده</span>
        </span>
        <span className="lg">
          <span className="jp-cv-cm-sm" aria-hidden><Spark s={9} /></span>
          <span>نشانِ همراه</span>
        </span>
        {overflow && <span className="jp-drag-hint">— با فلش‌ها حرکت کن</span>}
      </div>
    </>
  );
}
