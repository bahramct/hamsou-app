// ─────────────────────────────────────────────────────────────────────────────
// share-image.tsx — بلوک‌های مشترکِ تصویرِ اشتراک‌گذاری (next/og · Satori) — DECISION-054
//
// دو خروجی از یک خط لوله:
//   • CompactCard — کارتِ ۱۲۰۰×۶۳۰ (پیش‌نمایشِ لینک در شبکه‌ها + دانلودِ فشرده)
//   • Poster      — پوسترِ بلندِ ۱۰۸۰×۱۸۰۰ شاملِ متریک‌ها، نوارِ هفته، خلاصه،
//                    نکات، دو نمودارِ تأمل (دونات + رادار) و یک نقل‌قولِ کوتاه.
//
// قاعدهٔ فنی (مهم): متنِ فارسی همیشه با Satori رندر می‌شود (فونتِ PelakFA از دیسک)؛
// «شکلِ» نمودارها به‌صورت SVGِ بدونِ متن به‌عنوان <img> جاسازی می‌شود (resvg آن را
// رَستر می‌کند — بدون نیاز به فونت). اعداد/برچسب‌های نمودار روی تصویر با Satori
// قرار می‌گیرند تا فارسی درست نمایش داده شود. هیچ var()/backdrop-filter (نه resvg
// نه Satori پشتیبانی نمی‌کنند) — همه رنگ‌ها hex صریح.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  mapToDimensions,
  hasAnyDimensionActivity,
  DIMENSION_SHORT,
  type DimensionKey,
} from "@/lib/reports/life-dimensions";
import {
  donutSvg as _donutSvg,
  radarSvg as _radarSvg,
  RADAR,
  radarPoint,
  STATE_HEX,
} from "@/lib/reports/chart-svg";
import type {
  WeeklyMetrics,
  WeeklyCategory,
  WeeklyDayCell,
  WeeklyReportContent,
  DayState,
} from "@/types/weekly-report";

// ── پالتِ همسو (hex صریح — هم‌ارزِ توکن‌های globals.css) ───────────────────────
const K = {
  ink: "#1A1A1F",
  charcoal: "#2E2C28",
  stone: "#6B6657",
  fog: "#BDB6A7",
  bone: "#EAE4D6",
  paper: "#F5F2EB",
  sage: "#7A8471",
  sageDeep: "#5C6555",
  ember: "#C75D3C",
  mist: "#9BB4C7",
  gold: "#C19A4A",
} as const;

export const SHARE_SIZES = {
  card: { width: 1200, height: 630 },
  poster: { width: 1080, height: 2040 },
} as const;

export type ShareFormat = keyof typeof SHARE_SIZES;

// ── دادهٔ ورودیِ تصویر (از ردیفِ گزارش ساخته می‌شود) ───────────────────────────
export interface ShareImageData {
  jalaliStart: string;
  jalaliEnd: string;
  metrics: WeeklyMetrics;
  dayStrip: WeeklyDayCell[];
  summary: string;
  insights: { text: string }[];
  categories: WeeklyCategory[];
  reflection: string | null;
  displayName?: string | null;
}

function fa(n: number): string {
  return n.toLocaleString("fa-IR");
}

// ── نرمال‌سازیِ محتوا (سازگاری عقب با v1/v2 — هم‌ارزِ normalize در view‌ها) ─────
export function buildShareImageData(
  content: WeeklyReportContent,
  jalaliStart: string,
  jalaliEnd: string,
  displayName: string | null = null
): ShareImageData {
  const metrics: WeeklyMetrics =
    content.metrics ??
    (() => {
      const done = content.doneCount ?? 0;
      const notDone = content.notDoneCount ?? 0;
      const pending = content.pendingCount ?? 0;
      const active = content.totalEntries ?? done + notDone + pending;
      return {
        totalDays: 7,
        activeDays: active,
        doneCount: done,
        notDoneCount: notDone,
        pendingCount: pending,
        gapDays: 0,
        freezeDays: 0,
        emptyDays: Math.max(0, 7 - active),
        doneOfCommitted: content.completionRate ?? 0,
      };
    })();

  const categories: WeeklyCategory[] = (content.categories ?? []).map((c) => ({
    label: c.label,
    doneCount: c.doneCount,
    notDoneCount: c.notDoneCount,
    total: c.total ?? c.doneCount + c.notDoneCount,
    dimension: c.dimension,
  }));

  const insights =
    content.insights && content.insights.length > 0
      ? content.insights
      : (content.highlights ?? []).map((text) => ({ text }));

  return {
    jalaliStart: noGroup(jalaliStart),
    jalaliEnd: noGroup(jalaliEnd),
    metrics,
    dayStrip: content.dayStrip ?? [],
    summary: content.summary,
    insights,
    categories,
    reflection: content.reflection,
    displayName,
  };
}

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

// حذفِ جداکنندهٔ هزارگانِ سال جلالی. توجه: Satori در Node اجرا می‌شود و ICUِ Node
// عددِ ۴‌رقمی (۱۴۰۴) را گروه‌بندی می‌کند (۱٬۴۰۴) — برخلافِ مرورگر. سال نباید
// جداکننده داشته باشد، پس ٬/، و «,» را از رشتهٔ تاریخ پاک می‌کنیم (فقط سال متأثر است).
function noGroup(s: string): string {
  return s.replace(/[٬،,]/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// فونت — PelakFA از دیسک (TTF) برای Satori
// ─────────────────────────────────────────────────────────────────────────────
const FONT_DIR = join(process.cwd(), "public", "Fonts", "Farsi Numeral", "ttf");

// lang بدون تنظیم — Satori وقتی lang تعیین شود فونت را محدود می‌کند و متن‌های
// بدون lang صریح خالی می‌شوند. PelakFA خودش shaping فارسی/عربی دارد.
let _fonts: { name: string; data: Buffer; weight: 400 | 500 | 600 | 700 | 800; style: "normal" }[] | null = null;

export function loadShareFonts() {
  if (_fonts) return _fonts;
  const file = (f: string) => readFileSync(join(FONT_DIR, f));
  _fonts = [
    { name: "Pelak", data: file("PelakFA-Regular.ttf"), weight: 400, style: "normal" },
    { name: "Pelak", data: file("PelakFA-Medium.ttf"), weight: 500, style: "normal" },
    { name: "Pelak", data: file("PelakFA-SemiBold.ttf"), weight: 600, style: "normal" },
    { name: "Pelak", data: file("PelakFA-Bold.ttf"), weight: 700, style: "normal" },
    { name: "Pelak", data: file("PelakFA-ExtraBold.ttf"), weight: 800, style: "normal" },
  ];
  return _fonts;
}

// ─────────────────────────────────────────────────────────────────────────────
// نمودارها به‌صورت SVG رشته‌ای (بدونِ متن) → data-URI برای <img>
// ─────────────────────────────────────────────────────────────────────────────

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const donutSvg = _donutSvg;
const radarSvg = _radarSvg;

// ─────────────────────────────────────────────────────────────────────────────
// اجزای مشترکِ JSX (Satori)
// ─────────────────────────────────────────────────────────────────────────────

function BrandMark({ size = 56, radius = 16 }: { size?: number; radius?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: K.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: K.paper,
        fontSize: size * 0.54,
        fontWeight: 800,
        fontFamily: "Pelak",
      }}
    >
      ه
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CompactCard — ۱۲۰۰×۶۳۰
// ─────────────────────────────────────────────────────────────────────────────
export function CompactCard({ data }: { data: ShareImageData }) {
  const m = data.metrics;
  const metrics = [
    { value: m.activeDays, label: "روز فعال" },
    { value: m.doneCount, label: "انجام شد" },
    { value: m.gapDays, label: "روز گپ" },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        direction: "rtl",
        fontFamily: "Pelak",
        background: "linear-gradient(135deg, #F5F2EB 0%, #EAE4D6 100%)",
        padding: "72px 80px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -160,
          left: -120,
          width: 420,
          height: 420,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(122,132,113,0.28), rgba(122,132,113,0))",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -180,
          right: -100,
          width: 460,
          height: 460,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(155,180,199,0.26), rgba(155,180,199,0))",
          display: "flex",
        }}
      />

      <div style={{ display: "flex", direction: "rtl", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", direction: "rtl", alignItems: "center", gap: 16 }}>
          <BrandMark />
          <span style={{ fontSize: 34, fontWeight: 700, color: K.ink, fontFamily: "Pelak" }}>همسو</span>
        </div>
        <span style={{ fontSize: 24, color: K.stone, fontFamily: "Pelak", textAlign: "right" }}>گزارش هفتگی</span>
      </div>

      <div style={{ display: "flex", direction: "rtl", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 30, color: K.stone, fontFamily: "Pelak", textAlign: "right" }}>یک هفته از مسیر</span>
        <span style={{ fontSize: 60, color: K.ink, fontWeight: 800, letterSpacing: -1, fontFamily: "Pelak", direction: "rtl", textAlign: "right" }}>
          {data.jalaliStart} تا {data.jalaliEnd}
        </span>
      </div>

      <div style={{ display: "flex", direction: "rtl", gap: 24 }}>
        {metrics.map((mt) => (
          <div
            key={mt.label}
            style={{
              flex: 1,
              display: "flex",
              direction: "rtl",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "28px 0",
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(0,0,0,0.05)",
              borderRadius: 28,
            }}
          >
            <span style={{ fontSize: 64, fontWeight: 800, color: K.ink, fontFamily: "Pelak", textAlign: "center" }}>{fa(mt.value)}</span>
            <span style={{ fontSize: 24, color: K.stone, fontFamily: "Pelak", textAlign: "center" }}>{mt.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Poster — ۱۰۸۰×۱۸۰۰
// ─────────────────────────────────────────────────────────────────────────────

function PanelCaption({ children }: { children: string }) {
  return (
    <span style={{ fontSize: 22, color: K.fog, letterSpacing: 4, fontWeight: 500, fontFamily: "Pelak", textAlign: "right", alignSelf: "flex-start" }}>{children}</span>
  );
}

const DAY_BG: Record<DayState, { bg: string; border: string }> = {
  done: { bg: K.sage, border: K.sage },
  not_done: { bg: "rgba(199,93,60,0.16)", border: "rgba(199,93,60,0.45)" },
  pending: { bg: "rgba(189,182,167,0.22)", border: "rgba(189,182,167,0.5)" },
  gap: { bg: "rgba(155,180,199,0.14)", border: "rgba(155,180,199,0.5)" },
  freeze: { bg: "rgba(125,195,230,0.12)", border: "rgba(125,195,230,0.45)" },
  empty: { bg: "rgba(0,0,0,0)", border: "rgba(189,182,167,0.3)" },
};

export function Poster({ data }: { data: ShareImageData }) {
  const m = data.metrics;
  const metrics = [
    { value: m.activeDays, of: m.totalDays, label: "روز فعال" },
    { value: m.doneCount, of: m.activeDays, label: "انجام شد" },
    { value: m.gapDays, label: "روز گپ" },
  ];

  const dims = mapToDimensions(data.categories);
  const radarActive = hasAnyDimensionActivity(dims);
  const donutUri = svgToDataUri(donutSvg(m));
  const radarUri = svgToDataUri(radarSvg(dims));

  // legendِ دونات (هم‌ترتیب با اسلایس‌ها)
  const donutLegend: { color: string; label: string; n: number }[] = (
    [
      [K.sage, "انجام شد", m.doneCount],
      [K.ember, "نشد", m.notDoneCount],
      [K.gold, "بی‌بازخورد", m.pendingCount],
      [K.mist, "گپ", m.gapDays],
      [K.fog, "خالی", m.emptyDays],
    ] as [string, string, number][]
  )
    .filter(([, , n]) => n > 0)
    .map(([color, label, n]) => ({ color, label, n }));

  const insights = data.insights.slice(0, 3);
  const reflectionQuote = data.reflection ? clip(data.reflection, 150) : null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        direction: "rtl",
        fontFamily: "Pelak",
        background: "linear-gradient(160deg, #F7F4ED 0%, #EFEADF 55%, #EAE4D6 100%)",
        padding: "64px 64px 56px",
        position: "relative",
      }}
    >
      {/* بلاب‌های نرم */}
      <div
        style={{
          position: "absolute",
          top: -180,
          right: -140,
          width: 460,
          height: 460,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(122,132,113,0.20), rgba(122,132,113,0))",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          left: -160,
          width: 500,
          height: 500,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(155,180,199,0.18), rgba(155,180,199,0))",
          display: "flex",
        }}
      />

      {/* هدر */}
      <div style={{ display: "flex", direction: "rtl", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", direction: "rtl", alignItems: "center", gap: 14 }}>
          <BrandMark size={48} radius={14} />
          <span style={{ fontSize: 30, fontWeight: 700, color: K.ink, fontFamily: "Pelak", textAlign: "right" }}>همسو</span>
        </div>
        <span style={{ fontSize: 20, color: K.fog, letterSpacing: 3, fontFamily: "Pelak", textAlign: "right" }}>گزارش هفتگی</span>
      </div>

      {/* بازهٔ هفته */}
      <div style={{ display: "flex", direction: "rtl", flexDirection: "column", gap: 10, marginTop: 34 }}>
        <span style={{ fontSize: 24, color: K.stone, fontFamily: "Pelak", textAlign: "right" }}>یک هفته از مسیر</span>
        <span style={{ fontSize: 50, color: K.ink, fontWeight: 800, letterSpacing: -1, fontFamily: "Pelak", direction: "rtl", textAlign: "right" }}>
          {data.jalaliStart} تا {data.jalaliEnd}
        </span>
        {data.displayName ? (
          <span style={{ fontSize: 22, color: K.stone, fontFamily: "Pelak", textAlign: "right" }}>از مسیرِ {data.displayName}</span>
        ) : null}
      </div>

      {/* متریک‌ها */}
      <div style={{ display: "flex", direction: "rtl", gap: 20, marginTop: 30 }}>
        {metrics.map((f) => (
          <div
            key={f.label}
            style={{
              flex: 1,
              display: "flex",
              direction: "rtl",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "26px 0",
              background: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(0,0,0,0.05)",
              borderRadius: 26,
            }}
          >
            <div style={{ display: "flex", direction: "rtl", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 52, fontWeight: 700, color: K.ink, fontFamily: "Pelak", textAlign: "center" }}>{fa(f.value)}</span>
              {f.of !== undefined ? (
                <span style={{ fontSize: 26, color: K.fog, fontFamily: "Pelak", textAlign: "center" }}>از {fa(f.of)}</span>
              ) : null}
            </div>
            <span style={{ fontSize: 21, color: K.stone, fontFamily: "Pelak", textAlign: "center" }}>{f.label}</span>
          </div>
        ))}
      </div>

      {/* نوار ۷ روز */}
      {data.dayStrip.length > 0 ? (
        <div style={{ display: "flex", direction: "rtl", justifyContent: "space-between", marginTop: 30 }}>
          {data.dayStrip.map((d, i) => {
            const s = DAY_BG[d.state];
            return (
              <div key={i} style={{ display: "flex", direction: "rtl", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 22,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    display: "flex",
                  }}
                />
                <span style={{ fontSize: 19, color: K.fog, fontFamily: "Pelak", textAlign: "center" }}>{d.weekday.replace("‌", "")}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* خلاصه */}
      <div
        style={{
          display: "flex",
          direction: "rtl",
          flexDirection: "column",
          gap: 14,
          marginTop: 30,
          padding: "28px 30px",
          background: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(0,0,0,0.05)",
          borderRadius: 26,
        }}
      >
        <PanelCaption>خلاصه</PanelCaption>
        <span style={{ fontSize: 26, color: K.stone, lineHeight: 1.85, fontFamily: "Pelak", direction: "rtl", textAlign: "right" }}>{clip(data.summary, 240)}</span>
      </div>

      {/* نکات */}
      {insights.length > 0 ? (
        <div style={{ display: "flex", direction: "rtl", flexDirection: "column", gap: 16, marginTop: 24 }}>
          <PanelCaption>نکات هفته</PanelCaption>
          {insights.map((it, i) => (
            <div key={i} style={{ display: "flex", direction: "rtl", alignItems: "flex-start", gap: 12 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 9999,
                  background: K.ember,
                  marginTop: 14,
                  display: "flex",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 25, color: K.stone, lineHeight: 1.7, fontFamily: "Pelak", direction: "rtl", textAlign: "right" }}>{clip(it.text, 110)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* نمودارها — دونات + رادار، کنار هم */}
      <div style={{ display: "flex", direction: "rtl", gap: 20, marginTop: 28 }}>
        {/* دونات */}
        <div
          style={{
            flex: 1,
            display: "flex",
            direction: "rtl",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "26px 22px",
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: 26,
          }}
        >
          <PanelCaption>ترکیب هفته</PanelCaption>
          <div style={{ position: "relative", width: 200, height: 200, display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={donutUri} width={200} height={200} alt="" />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 200,
                height: 200,
                display: "flex",
                direction: "rtl",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 46, fontWeight: 700, color: K.ink, lineHeight: 1, fontFamily: "Pelak", textAlign: "center" }}>{fa(m.activeDays)}</span>
              <span style={{ fontSize: 19, color: K.fog, marginTop: 4, fontFamily: "Pelak", textAlign: "center" }}>روز فعال</span>
            </div>
          </div>
          <div style={{ display: "flex", direction: "rtl", flexDirection: "column", gap: 8, width: "100%" }}>
            {donutLegend.map((l) => (
              <div key={l.label} style={{ display: "flex", direction: "rtl", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", direction: "rtl", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 9999, background: l.color, display: "flex" }} />
                  <span style={{ fontSize: 21, color: K.stone, fontFamily: "Pelak", textAlign: "right" }}>{l.label}</span>
                </div>
                <span style={{ fontSize: 19, color: K.fog, fontFamily: "Pelak", textAlign: "right" }}>{fa(l.n)} روز</span>
              </div>
            ))}
          </div>
        </div>

        {/* رادار */}
        <div
          style={{
            flex: 1,
            display: "flex",
            direction: "rtl",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "26px 22px",
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: 26,
          }}
        >
          <PanelCaption>نقشهٔ زندگی</PanelCaption>
          <div style={{ position: "relative", width: RADAR.W, height: RADAR.H, display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={radarUri} width={RADAR.W} height={RADAR.H} alt="" />
            {dims.map((c, i) => {
              const [lx, ly] = radarPoint(i, RADAR.R + 22);
              const dim = c.total > 0;
              const short = c.dimension
                ? DIMENSION_SHORT[c.dimension as DimensionKey] ?? c.label
                : c.label;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: lx,
                    top: ly,
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    direction: "rtl",
                    fontSize: 20,
                    fontWeight: dim ? 600 : 500,
                    color: dim ? K.stone : K.fog,
                    fontFamily: "Pelak",
                  }}
                >
                  {short}
                </div>
              );
            })}
          </div>
          {!radarActive ? (
            <span style={{ fontSize: 18, color: K.fog, fontFamily: "Pelak", textAlign: "center" }}>این هفته فعالیتی برای نقشه ثبت نشد.</span>
          ) : null}
        </div>
      </div>

      {/* نقل‌قولِ تأمل */}
      {reflectionQuote ? (
        <div
          style={{
            display: "flex",
            direction: "rtl",
            marginTop: 28,
            padding: "26px 30px",
            background: "rgba(199,93,60,0.06)",
            borderRight: `4px solid ${K.ember}`,
            borderRadius: 20,
          }}
        >
          <span style={{ fontSize: 26, color: K.charcoal, lineHeight: 1.85, fontFamily: "Pelak", direction: "rtl", textAlign: "right" }}>{reflectionQuote}</span>
        </div>
      ) : null}

      {/* فوتر */}
      <div
        style={{
          display: "flex",
          direction: "rtl",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginTop: "auto",
          paddingTop: 34,
        }}
      >
        <BrandMark size={34} radius={10} />
        <span style={{ fontSize: 22, color: K.stone, fontFamily: "Pelak", textAlign: "center" }}>ساخته‌شده با همسو</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BrandCard — برای گزارشِ خصوصی/ناموجود (بدون نشتِ داده)
// ─────────────────────────────────────────────────────────────────────────────
export function BrandCard({ width, height }: { width: number; height: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        direction: "rtl",
        fontFamily: "Pelak",
        background: "linear-gradient(135deg, #F5F2EB 0%, #EAE4D6 100%)",
      }}
    >
      <BrandMark size={Math.round(Math.min(width, height) * 0.14)} radius={28} />
      <span style={{ fontSize: 44, fontWeight: 700, color: K.ink }}>همسو</span>
      <span style={{ fontSize: 26, color: K.stone }}>برای واقعی‌تر زندگی کردن</span>
    </div>
  );
}
