// ─────────────────────────────────────────────────────────────────────────────
// PulseTile — «نبضِ این هفته» (TASK-28؛ مو‌به‌موی dashboard-unified.html)
// راهنما (۴ سوآچ) + ریتمِ ۷ پیلِ هم‌عرض (ارتفاع ۴۴) + جملهٔ اول‌شخص.
// خط‌قرمزِ مانیفست: «حضور»، نه نمره؛ بدون درصد/استریک. فقط در داشبورد.
// ─────────────────────────────────────────────────────────────────────────────

import type { WeekDayActivity } from "@/lib/dashboard/activity";

interface Props {
  days: WeekDayActivity[];
  wroteCount: number;
  freezeCount: number;
  emptyCount: number;
  todayWrote: boolean;
}

function fa(n: number): string {
  return n.toLocaleString("fa-IR");
}

function caption(wrote: number, freeze: number, empty: number, todayWrote: boolean): string {
  const parts: string[] = [];
  if (wrote > 0) parts.push(`${fa(wrote)} روز نوشتم`);
  if (freeze > 0) parts.push(`${fa(freeze)} روز فریز گذاشتم`);
  if (empty > 0) parts.push(`${fa(empty)} روز نبودم`);
  let text = parts.length ? `این هفته ${parts.join("، ")}.` : "این هفته تازه شروع شده.";
  if (todayWrote) text += " امروز هم نوشتم.";
  return text;
}

export function PulseTile({ days, wroteCount, freezeCount, emptyCount, todayWrote }: Props) {
  return (
    <div className="dsh-tile t-pulse glass">
      <div className="dsh-lbl">نبضِ این هفته</div>

      <div className="dsh-legend">
        <span className="dsh-lg"><span className="sw wrote" />نوشتم</span>
        <span className="dsh-lg"><span className="sw empty" />نبودم</span>
        <span className="dsh-lg"><span className="sw freeze" />فریز</span>
        <span className="dsh-lg"><span className="sw today" />امروز</span>
      </div>

      <div className="dsh-rhythm">
        {days.map((d) => (
          <div key={d.dateIso} className={`dsh-rh${d.isToday ? " today" : ""}`}>
            <div className={`dsh-rh-pill ${d.state}`}>
              {d.state === "freeze" && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3v18M5 7l14 10M19 7 5 17" stroke="var(--color-mist-deep)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <span className="dsh-rh-day">{d.weekdayShort}</span>
          </div>
        ))}
      </div>

      <p className="dsh-pulse-line">{caption(wroteCount, freezeCount, emptyCount, todayWrote)}</p>
    </div>
  );
}
