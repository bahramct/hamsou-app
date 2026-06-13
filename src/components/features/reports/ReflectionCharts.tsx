"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ReflectionCharts — دو نمودار تب تأمل (DECISION-047 + DECISION-050)
//   • WeekDonut    — ترکیب ۷ روز هفته بر اساس وضعیت (دونات)
//   • CategoryChart— نقشهٔ زندگی روی ۶ بُعدِ ثابت (رادار همیشگی، بدون منطق سه‌حالته)
//
// رادار همیشه روی ۶ محورِ ثابتِ زندگی رسم می‌شود — چه هفته پر باشد چه خلوت (مالک).
// mapToDimensions هر دستهٔ پویا را به یکی از ۶ بُعد می‌نگارد و همیشه ۶ محور می‌دهد.
//
// انیمیشن با rAF (هندسه مستقیماً با progress محاسبه می‌شود — مطمئن، بدون اتکا به
// transform-box/transform-origin که قبلاً رادار را نامرئی می‌کرد). پالت خاکیِ همسو،
// گرادیان + سایه نرم + گلس‌مورفیسم. فونت PelakFA، ارقام فارسیِ واقعی (toFa).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useId, useRef, useState } from "react";
import type { WeeklyMetrics, WeeklyCategory, DayState } from "@/types/weekly-report";
import {
  mapToDimensions,
  hasAnyDimensionActivity,
  DIMENSION_SHORT,
  type DimensionKey,
} from "@/lib/reports/life-dimensions";

function toFa(n: number): string {
  return n.toLocaleString("fa-IR");
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// progress 0→1 با easeOutCubic از طریق requestAnimationFrame
function useReveal(duration = 850): number {
  const [p, setP] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [duration]);
  return p;
}

const STATE_COLOR: Record<DayState, string> = {
  done: "var(--color-sage)",
  not_done: "var(--color-ember)",
  pending: "var(--color-gold)",
  gap: "var(--color-mist)",
  freeze: "var(--color-mist)",
  empty: "var(--color-fog)",
};

const STATE_LABEL: Record<DayState, string> = {
  done: "انجام شد",
  not_done: "نشد",
  pending: "بی‌بازخورد",
  gap: "گپ",
  freeze: "فریز",
  empty: "خالی",
};

// ─── دونات ترکیب هفته ─────────────────────────────────────────────────────────

export function WeekDonut({ metrics }: { metrics: WeeklyMetrics }) {
  const p = useReveal();
  const uid = useId().replace(/:/g, "");

  const slices = (
    [
      ["done", metrics.doneCount],
      ["not_done", metrics.notDoneCount],
      ["pending", metrics.pendingCount],
      ["gap", metrics.gapDays],
      ["empty", metrics.emptyDays],
    ] as [DayState, number][]
  ).filter(([, n]) => n > 0);

  const total = slices.reduce((s, [, n]) => s + n, 0) || 1;
  const R = 74;
  const SW = 20;
  const C = 2 * Math.PI * R;
  const GAP = slices.length > 1 ? 5 : 0;

  let cum = 0;
  const arcs = slices.map(([state, n]) => {
    const frac = n / total;
    const slot = frac * C;
    const drawn = Math.max(0, (slot - GAP) * p);
    const startOffset = -(cum * C + GAP / 2);
    cum += frac;
    return { state, n, frac, drawn, startOffset };
  });

  return (
    <div className="flex items-center gap-5 w-full">
      <div className="relative shrink-0">
        <svg viewBox="0 0 200 200" className="w-37.5 h-37.5" style={{ fontFamily: "var(--font-pelak)" }}>
          <defs>
            <filter id={`sh-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" floodColor="#2E2C28" floodOpacity="0.16" />
            </filter>
          </defs>
          {/* شیار پس‌زمینه */}
          <circle cx={100} cy={100} r={R} fill="none" stroke="var(--color-bone)" strokeWidth={SW} opacity={0.5} />
          <g transform="rotate(-90 100 100)" filter={`url(#sh-${uid})`}>
            {arcs.map((a) => (
              <circle
                key={a.state}
                cx={100}
                cy={100}
                r={R}
                fill="none"
                stroke={STATE_COLOR[a.state]}
                strokeWidth={SW}
                strokeLinecap="round"
                strokeDasharray={`${a.drawn} ${C - a.drawn}`}
                strokeDashoffset={a.startOffset}
              />
            ))}
          </g>
        </svg>
        {/* مرکز */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ opacity: p }}
        >
          <span className="text-[26px] font-semibold text-ink fa-num leading-none">{toFa(metrics.activeDays)}</span>
          <span className="text-[10px] text-fog mt-1">روز فعال</span>
        </div>
      </div>

      {/* راهنما */}
      <ul className="flex-1 space-y-2 min-w-0">
        {arcs.map((a) => (
          <li
            key={a.state}
            className="flex items-center justify-between gap-2"
            style={{ opacity: p, transform: `translateX(${(1 - p) * -6}px)` }}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/70"
                style={{ background: STATE_COLOR[a.state] }}
              />
              <span className="text-[13px] text-stone truncate">{STATE_LABEL[a.state]}</span>
            </span>
            <span className="text-[11px] text-fog fa-num shrink-0">
              {toFa(a.n)} روز · {toFa(Math.round(a.frac * 100))}٪
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── نقشهٔ زندگی (رادار همیشگیِ ۶‌محور) ────────────────────────────────────────

/**
 * نقشهٔ دسته‌ها — همیشه رادار روی ۶ بُعدِ ثابتِ زندگی (DECISION-050).
 * هر شکلی از categories (پویا یا قدیمی) با mapToDimensions به دقیقاً ۶ محور تبدیل
 * می‌شود؛ پس رادار در هر شرایطی (هفتهٔ پر یا خلوت) همان فرم را دارد.
 */
export function CategoryChart({ categories }: { categories: WeeklyCategory[] }) {
  const dims = mapToDimensions(categories);
  return <CategoryRadar dims={dims} />;
}

function CategoryRadar({ dims }: { dims: WeeklyCategory[] }) {
  const p = useReveal(900);
  const uid = useId().replace(/:/g, "");
  const N = dims.length; // همیشه ۶

  // viewBox عریض‌تر از بلند → حاشیهٔ افقی کافی برای برچسب‌های فارسیِ کناری
  // (نسخهٔ قبلی ۳۲۰×۳۲۰ بود و برچسب‌های چپ/راست کلیپ می‌شدند).
  const W = 360;
  const H = 300;
  const cx = W / 2;
  const cy = 148;
  const R = 84;
  // کفِ حداقلیِ شعاع: تضمین می‌کند چندضلعی همیشه «شکل» باشد، نه یک سوزن از مرکز
  // (هفتهٔ تک‌بُعدی قبلاً به یک خط فرومی‌پاشید). نقاط داده فقط روی محورهای فعال‌اند
  // پس صداقتِ خواندن حفظ می‌شود؛ کف فقط برای فرمِ بصری است.
  const FLOOR = 0.12;

  const maxVal = Math.max(...dims.map((c) => c.total), 1);
  const active = hasAnyDimensionActivity(dims);

  const angle = (i: number) => ((-90 + (i * 360) / N) * Math.PI) / 180;
  const point = (i: number, rr: number): [number, number] => [
    cx + rr * Math.cos(angle(i)),
    cy + rr * Math.sin(angle(i)),
  ];

  const ringLevels = [0.25, 0.5, 0.75, 1];
  const rings = ringLevels.map((f) => dims.map((_, i) => point(i, f * R).join(",")).join(" "));
  const spokes = dims.map((_, i) => point(i, R));

  // شعاعِ هر رأس = کف + سهمِ نسبیِ دسته (نرمال‌شده با بیشینه). با progress باز می‌شود.
  const radiusOf = (c: WeeklyCategory) =>
    (FLOOR + (1 - FLOOR) * (c.total / maxVal)) * R;
  const dataPts = dims.map((c, i) => point(i, radiusOf(c) * p));
  const dataPolygon = dataPts.map((pt) => pt.join(",")).join(" ");

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-95 mx-auto h-auto" style={{ fontFamily: "var(--font-pelak)" }}>
        <defs>
          <radialGradient id={`fill-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-mist)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-mist)" stopOpacity="0.12" />
          </radialGradient>
          <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="var(--color-mist)" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* صفحهٔ پس‌زمینهٔ بسیار کم‌رنگ */}
        <polygon points={rings[ringLevels.length - 1]} fill="var(--color-fog)" fillOpacity={0.06} />

        {/* حلقه‌های شبکه */}
        {rings.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="var(--color-fog)" strokeOpacity={0.3} strokeWidth={1} />
        ))}
        {/* پره‌ها */}
        {spokes.map(([x, y], i) => (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-fog)" strokeOpacity={0.25} strokeWidth={1} />
        ))}

        {/* چندضلعی داده — فقط وقتی فعالیتی هست (در غیر این صورت شبکهٔ خالی می‌ماند) */}
        {active && (
          <>
            <polygon
              points={dataPolygon}
              fill={`url(#fill-${uid})`}
              stroke="var(--color-mist)"
              strokeWidth={2}
              strokeLinejoin="round"
              filter={`url(#glow-${uid})`}
            />
            {dataPts.map(([x, y], i) =>
              dims[i].total > 0 ? (
                <circle key={i} cx={x} cy={y} r={3.5} fill="var(--color-mist)" stroke="var(--color-paper)" strokeWidth={1.75} style={{ opacity: p }} />
              ) : null
            )}
          </>
        )}

        {/* مرکز وقتی خالی است */}
        {!active && <circle cx={cx} cy={cy} r={3} fill="var(--color-fog)" fillOpacity={0.5} />}

        {/* برچسب محورها (همیشه هر ۶ بُعد، کوتاه — کلیپ نمی‌شود) */}
        {dims.map((c, i) => {
          const [lx, ly] = point(i, R + 18);
          const anchor = Math.abs(lx - cx) < 10 ? "middle" : lx > cx ? "start" : "end";
          const dy = ly < cy - 10 ? 0 : ly > cy + 10 ? 11 : 4;
          const dim = c.total > 0;
          const short = c.dimension
            ? DIMENSION_SHORT[c.dimension as DimensionKey] ?? truncate(c.label, 8)
            : truncate(c.label, 8);
          return (
            <text
              key={i}
              x={lx}
              y={ly + dy}
              textAnchor={anchor}
              fill={dim ? "var(--color-stone)" : "var(--color-fog)"}
              style={{ fontSize: "12px", fontWeight: dim ? 600 : 500 }}
            >
              {short}
            </text>
          );
        })}
      </svg>

      {!active && (
        <p className="text-[11px] text-fog text-center mt-1">این هفته فعالیتی برای نقشه ثبت نشد.</p>
      )}
    </div>
  );
}
