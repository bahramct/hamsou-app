"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GoalTile — تایلِ «هدفِ فعال» در بِنتوی داشبورد (TASK-28؛ مو‌به‌موی dashboard-unified.html)
// شاملِ تایم‌لاینِ ریزِ نقطه‌ای، استوریِ امروز و پنلِ همراه (پرو/رایگان).
// پاپ‌اوورِ استوری: لمس‌محور (tap) — چون موبایل hover ندارد؛ روی دسکتاپ hover هم کار می‌کند.
// در ستونِ راستِ بِنتو دو ردیف را می‌گیرد و کف‌اش با CTA «بازکردنِ هدف» لنگر می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useState } from "react";
import type { GoalType } from "@/types/goal";

export interface GoalTimelineNode {
  dayNumber: number;
  weekdayLabel: string;
  kind: "filled" | "today" | "future";
  preview: string | null;
  hasMore: boolean;
}

export interface GoalTileData {
  hasGoal: boolean;
  type: GoalType;
  title: string;
  dayNumber: number;
  totalDays: number;
  timeline: GoalTimelineNode[];
  todayStory: string | null;
  companionPlanAllowed: boolean;
  companionLatest: string | null;
}

function fa(n: number): string {
  return n.toLocaleString("fa-IR");
}

function Chevron() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Sparkle({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function GoalTile({ data }: { data: GoalTileData }) {
  if (!data.hasGoal) {
    return (
      <div className="dsh-tile t-goal glass">
        <div className="dsh-head">
          <span className="tile-ic ic-sage" aria-hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4M4 4h13l-2 4 2 4H4" /></svg></span>
          <div className="dsh-lbl">برنامه‌ریزی و چالش</div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage/12 text-sage-deep">
            <Sparkle />
          </span>
          <p className="max-w-[18rem] text-[13px] leading-relaxed text-stone">
            هنوز مسیرِ فعالی نداری. یک هدف یا چالشِ کوتاه شروع کن و هر روز دربارهٔ مسیرت بنویس.
          </p>
        </div>
        <div className="dsh-foot">
          <Link href="/goal" className="dsh-cta">شروعِ یک مسیر <Chevron /></Link>
        </div>
      </div>
    );
  }

  const today = data.dayNumber;
  // پاپ‌اوورِ استوری: نمایش تا وقتی انگشت روی نقطه است (press-hold)؛ رها = پنهان.
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="dsh-tile t-goal glass">
      <div className="dsh-head">
        <span className="tile-ic ic-sage" aria-hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></svg></span>
        <div className="dsh-lbl">هدفِ فعال</div>
      </div>
      <div className="dsh-goal-title">{data.title}</div>
      <div className="dsh-goal-meta">
        <span className="dsh-goal-day fa-num">روز {fa(Math.max(today, 1))} از {fa(data.totalDays)}</span>
      </div>

      {/* تایم‌لاینِ ریز */}
      {data.timeline.length > 0 && (
        <div className="dsh-tl">
          {data.timeline.map((n, i) => (
            <div key={n.dayNumber} style={{ display: "contents" }}>
              {i > 0 && (
                <span className={`dsh-tl-link${data.timeline[i - 1].dayNumber < today ? " done" : ""}`} />
              )}
              <div
                className={`dsh-tl-item${openIdx === i ? " is-open" : ""}`}
                style={{ touchAction: "pan-y" }}
                onPointerDown={(e) => { if (e.pointerType === "touch") setOpenIdx(i); }}
                onPointerUp={() => setOpenIdx(null)}
                onPointerLeave={() => setOpenIdx(null)}
                onPointerCancel={() => setOpenIdx(null)}
              >
                <span className={`dsh-tl-node ${n.kind === "today" ? "today" : n.kind === "future" ? "future" : "filled"}`} />
                <div className="dsh-tl-pop">
                  {n.kind === "future" ? (
                    <div className="empty fa-num">روز {fa(n.dayNumber)} · هنوز نرسیده</div>
                  ) : (
                    <>
                      <div className="d fa-num">{n.kind === "today" ? "امروز · روز " + fa(n.dayNumber) : "روز " + fa(n.dayNumber) + " · " + n.weekdayLabel}</div>
                      <div className="s">{n.preview ?? "خالی ماند."}</div>
                      {/* {n.hasMore && <div className="more">برای متنِ کامل، بازکن →</div>} */}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* استوریِ امروز
      {data.todayStory && (
        <div className="dsh-goal-story">
          <div className="q">استوریِ امروز</div>
          {data.todayStory}
        </div>
      )} */}

      {/* پنلِ همراه */}
      {data.companionPlanAllowed ? (
        <div className="dsh-cp pro">
          <div className="dsh-cp-head">
            <span className="dsh-cp-av"><Sparkle s={14} /></span>
            <span className="dsh-cp-name">همراه</span>
            <span className="dsh-chip-pro">پرو</span>
          </div>
          {data.companionLatest ? (
            <p className="dsh-cp-text">«{data.companionLatest}»</p>
          ) : (
            <p className="dsh-cp-text" style={{ color: "var(--color-stone)" }}>
              «همراه» در روزهای پیشِ رو نگاهی تازه به مسیرت می‌نویسد.
            </p>
          )}
          <Link href="/goal" className="dsh-cp-more">خواندنِ کامل ←</Link>
        </div>
      ) : (
        <div className="dsh-cp free">
          <span className="dsh-cp-glyph"><Sparkle s={20} /></span>
          <p className="dsh-cp-line">
            «همراه» در پلنِ پرو، هر چند روز یک‌بار نگاهی تازه و بی‌قضاوت به مسیرت می‌نویسد — مثلِ کسی که کنارت قدم می‌زند.
          </p>
          <Link href="/plans" className="dsh-cp-link">آشنایی با پرو <Chevron /></Link>
        </div>
      )}

      <div className="dsh-foot">
        <Link href="/goal" className="dsh-cta">بازکردنِ هدف <Chevron /></Link>
      </div>
    </div>
  );
}
