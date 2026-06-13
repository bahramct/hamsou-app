// chart-svg.ts — تولیدکنندهٔ SVG نمودارهای اشتراک‌گذاری (بدون وابستگی Node.js)
// قابل‌استفاده هم در سرور (share-image.tsx / Satori) هم در کلاینت (SharePosterCanvas)

import {
  mapToDimensions,
  hasAnyDimensionActivity,
  DIMENSION_SHORT,
  type DimensionKey,
} from "@/lib/reports/life-dimensions";
import type { WeeklyMetrics, WeeklyCategory } from "@/types/weekly-report";
import type { DayState } from "@/types/weekly-report";

export const CHART_K = {
  ink: "#1A1A1F",
  stone: "#6B6657",
  fog: "#BDB6A7",
  bone: "#EAE4D6",
  paper: "#F5F2EB",
  sage: "#7A8471",
  ember: "#C75D3C",
  mist: "#9BB4C7",
  gold: "#C19A4A",
} as const;

export const STATE_HEX: Record<DayState, string> = {
  done: CHART_K.sage,
  not_done: CHART_K.ember,
  pending: CHART_K.gold,
  gap: CHART_K.mist,
  freeze: CHART_K.mist,
  empty: CHART_K.fog,
};

/** دوناتِ ترکیب هفته — SVG رشته‌ای (بدون متن؛ عدد مرکز جداگانه رندر می‌شود) */
export function donutSvg(metrics: WeeklyMetrics): string {
  const raw: [DayState, number][] = [
    ["done", metrics.doneCount],
    ["not_done", metrics.notDoneCount],
    ["pending", metrics.pendingCount],
    ["gap", metrics.gapDays],
    ["empty", metrics.emptyDays],
  ];
  const slices = raw.filter(([, n]) => n > 0);
  const total = slices.reduce((s, [, n]) => s + n, 0) || 1;
  const R = 74;
  const SW = 22;
  const C = 2 * Math.PI * R;
  const GAP = slices.length > 1 ? 5 : 0;

  let cum = 0;
  const arcs = slices
    .map(([state, n]) => {
      const frac = n / total;
      const slot = frac * C;
      const drawn = Math.max(0, slot - GAP);
      const startOffset = -(cum * C + GAP / 2);
      cum += frac;
      return `<circle cx="100" cy="100" r="${R}" fill="none" stroke="${STATE_HEX[state]}" stroke-width="${SW}" stroke-linecap="round" stroke-dasharray="${drawn} ${C - drawn}" stroke-dashoffset="${startOffset}"/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><circle cx="100" cy="100" r="${R}" fill="none" stroke="${CHART_K.bone}" stroke-width="${SW}" opacity="0.55"/><g transform="rotate(-90 100 100)">${arcs}</g></svg>`;
}

export function svgToDataUri(svg: string): string {
  if (typeof btoa !== "undefined") {
    // browser
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }
  // Node
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// هندسهٔ رادار — ثابت مشترک
export const RADAR = { W: 360, H: 300, cx: 180, cy: 148, R: 84, FLOOR: 0.12, N: 6 } as const;
export const radarAngle = (i: number) => ((-90 + (i * 360) / RADAR.N) * Math.PI) / 180;
export function radarPoint(i: number, rr: number): [number, number] {
  return [RADAR.cx + rr * Math.cos(radarAngle(i)), RADAR.cy + rr * Math.sin(radarAngle(i))];
}

/** رادارِ نقشهٔ زندگی — SVG رشته‌ای (بدون متن؛ برچسب‌ها جداگانه رندر می‌شوند) */
export function radarSvg(dims: WeeklyCategory[]): string {
  const { cx, cy, R, FLOOR } = RADAR;
  const maxVal = Math.max(...dims.map((c) => c.total), 1);
  const active = hasAnyDimensionActivity(dims);

  const ringLevels = [0.25, 0.5, 0.75, 1];
  const rings = ringLevels
    .map((f) => {
      const pts = dims.map((_, i) => radarPoint(i, f * R).map((v) => v.toFixed(1)).join(",")).join(" ");
      return `<polygon points="${pts}" fill="none" stroke="${CHART_K.fog}" stroke-opacity="0.3" stroke-width="1"/>`;
    })
    .join("");
  const outer = dims.map((_, i) => radarPoint(i, R).map((v) => v.toFixed(1)).join(",")).join(" ");
  const spokes = dims
    .map((_, i) => {
      const [x, y] = radarPoint(i, R);
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${CHART_K.fog}" stroke-opacity="0.25" stroke-width="1"/>`;
    })
    .join("");

  const radiusOf = (c: WeeklyCategory) => (FLOOR + (1 - FLOOR) * (c.total / maxVal)) * R;
  const dataPts = dims.map((c, i) => radarPoint(i, radiusOf(c)));
  const dataPolygon = dataPts.map((pt) => pt.map((v) => v.toFixed(1)).join(",")).join(" ");
  const dots = active
    ? dims
        .map((c, i) =>
          c.total > 0
            ? `<circle cx="${dataPts[i][0].toFixed(1)}" cy="${dataPts[i][1].toFixed(1)}" r="4" fill="${CHART_K.mist}" stroke="${CHART_K.paper}" stroke-width="1.75"/>`
            : ""
        )
        .join("")
    : "";

  const dataLayer = active
    ? `<polygon points="${dataPolygon}" fill="url(#rfill)" stroke="${CHART_K.mist}" stroke-width="2.5" stroke-linejoin="round"/>${dots}`
    : `<circle cx="${cx}" cy="${cy}" r="3" fill="${CHART_K.fog}" fill-opacity="0.5"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RADAR.W} ${RADAR.H}" width="${RADAR.W}" height="${RADAR.H}"><defs><radialGradient id="rfill" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${CHART_K.mist}" stop-opacity="0.5"/><stop offset="100%" stop-color="${CHART_K.mist}" stop-opacity="0.12"/></radialGradient></defs><polygon points="${outer}" fill="${CHART_K.fog}" fill-opacity="0.06"/>${rings}${spokes}${dataLayer}</svg>`;
}

/** داده‌های legend دونات (فیلتر‌شده — فقط موارد با مقدار > 0) */
export function buildDonutLegend(metrics: WeeklyMetrics) {
  return (
    [
      [CHART_K.sage, "انجام شد", metrics.doneCount],
      [CHART_K.ember, "نشد", metrics.notDoneCount],
      [CHART_K.gold, "بی‌بازخورد", metrics.pendingCount],
      [CHART_K.mist, "گپ", metrics.gapDays],
      [CHART_K.fog, "خالی", metrics.emptyDays],
    ] as [string, string, number][]
  )
    .filter(([, , n]) => n > 0)
    .map(([color, label, n]) => ({ color, label, n }));
}

/** ابعاد زندگی برای نمایش رادار (شامل برچسب‌های کوتاه) */
export function buildRadarDims(categories: WeeklyCategory[]) {
  const dims = mapToDimensions(categories);
  return dims.map((c) => ({
    ...c,
    shortLabel: c.dimension
      ? (DIMENSION_SHORT[c.dimension as DimensionKey] ?? c.label)
      : c.label,
    active: hasAnyDimensionActivity([c]),
  }));
}

export { hasAnyDimensionActivity, mapToDimensions };
