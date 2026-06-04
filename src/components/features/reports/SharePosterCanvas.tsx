"use client";

// SharePosterCanvas — پوسترِ ۱۰۸۰×۲۰۴۰ برای دانلود (رندر مرورگر — بدون Satori)
// فونت PelakFA از globals.css بارگذاری می‌شود → فارسی/RTL کاملاً درست.

import type { ShareImageData } from "@/lib/reports/share-image";
import type { DayState } from "@/types/weekly-report";
import {
  donutSvg,
  radarSvg,
  buildDonutLegend,
  buildRadarDims,
  RADAR,
  radarPoint,
  STATE_HEX,
} from "@/lib/reports/chart-svg";

const K = {
  ink: "#1A1A1F",
  charcoal: "#2E2C28",
  stone: "#6B6657",
  fog: "#BDB6A7",
  bone: "#EAE4D6",
  paper: "#F5F2EB",
  sage: "#7A8471",
  ember: "#C75D3C",
  mist: "#9BB4C7",
  gold: "#C19A4A",
} as const;

const FONT = '"PelakFA", Tahoma, sans-serif';
const W = 1080;

function fa(n: number): string {
  return n.toLocaleString("fa-IR");
}

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

const DAY_BG: Record<DayState, { bg: string; border: string }> = {
  done: { bg: K.sage, border: K.sage },
  not_done: { bg: "rgba(199,93,60,0.16)", border: "rgba(199,93,60,0.45)" },
  pending: { bg: "rgba(189,182,167,0.22)", border: "rgba(189,182,167,0.5)" },
  gap: { bg: "rgba(155,180,199,0.14)", border: "rgba(155,180,199,0.5)" },
  empty: { bg: "rgba(0,0,0,0)", border: "rgba(189,182,167,0.3)" },
};

interface Props {
  data: ShareImageData;
}

export function SharePosterCanvas({ data }: Props) {
  const m = data.metrics;
  const metrics = [
    { value: m.activeDays, of: m.totalDays, label: "روز فعال" },
    { value: m.doneCount, of: m.activeDays, label: "انجام شد" },
    { value: m.gapDays, label: "روز گپ" },
  ];

  const donutUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(donutSvg(m))))}`;
  const radarDims = buildRadarDims(data.categories);
  const radarUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(radarSvg(radarDims))))}`;
  const donutLegend = buildDonutLegend(m);
  const insights = data.insights.slice(0, 3);
  const reflectionQuote = data.reflection ? clip(data.reflection, 220) : null;

  const panel = (children: React.ReactNode) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "28px 30px",
        background: "rgba(255,255,255,0.52)",
        border: "1px solid rgba(0,0,0,0.05)",
        borderRadius: 26,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );

  const caption = (text: string) => (
    <span
      style={{
        fontSize: 18,
        color: K.fog,
        fontWeight: 500,
        fontFamily: FONT,
        letterSpacing: 1,
        textAlign: "right",
      }}
    >
      {text}
    </span>
  );

  return (
    <div
      dir="rtl"
      style={{
        width: W,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(160deg, #F7F4ED 0%, #EFEADF 55%, #EAE4D6 100%)",
        padding: "64px 64px 56px",
        fontFamily: FONT,
        boxSizing: "border-box",
        gap: 28,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* blobهای تزئینی */}
      <div
        style={{
          position: "absolute",
          top: -180,
          right: -140,
          width: 460,
          height: 460,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(122,132,113,0.20) 0%, transparent 70%)",
          pointerEvents: "none",
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
          background: "radial-gradient(circle, rgba(155,180,199,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* هدر */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: K.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: K.paper,
              fontSize: 26,
              fontWeight: 800,
              fontFamily: FONT,
            }}
          >
            ه
          </div>
          <span style={{ fontSize: 30, fontWeight: 700, color: K.ink, fontFamily: FONT }}>همسو</span>
        </div>
        <span style={{ fontSize: 18, color: K.fog, letterSpacing: 1, fontFamily: FONT }}>گزارش هفتگی</span>
      </div>

      {/* بازهٔ هفته */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
        <span style={{ fontSize: 22, color: K.stone, fontFamily: FONT }}>یک هفته از مسیر</span>
        <span style={{ fontSize: 48, fontWeight: 800, color: K.ink, fontFamily: FONT, lineHeight: 1.15 }}>
          {data.jalaliStart} تا {data.jalaliEnd}
        </span>
        {data.displayName && (
          <span style={{ fontSize: 20, color: K.stone, fontFamily: FONT }}>از مسیرِ {data.displayName}</span>
        )}
      </div>

      {/* متریک‌ها */}
      <div style={{ display: "flex", gap: 20, position: "relative" }}>
        {metrics.map((f) => (
          <div
            key={f.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "26px 0",
              background: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(0,0,0,0.05)",
              borderRadius: 26,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 52, fontWeight: 700, color: K.ink, fontFamily: FONT }}>{fa(f.value)}</span>
              {f.of !== undefined && (
                <span style={{ fontSize: 24, color: K.fog, fontFamily: FONT }}>از {fa(f.of)}</span>
              )}
            </div>
            <span style={{ fontSize: 19, color: K.stone, fontFamily: FONT }}>{f.label}</span>
          </div>
        ))}
      </div>

      {/* نوار ۷ روز */}
      {data.dayStrip.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
          {data.dayStrip.map((d, i) => {
            const s = DAY_BG[d.state];
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 22,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                  }}
                />
                <span style={{ fontSize: 17, color: K.fog, fontFamily: FONT }}>{d.weekday.replace("‌", "")}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* خلاصه */}
      {panel(
        <>
          {caption("خلاصه")}
          <p style={{ fontSize: 24, color: K.stone, lineHeight: 1.9, fontFamily: FONT, margin: 0, textAlign: "right" }}>
            {clip(data.summary, 280)}
          </p>
        </>
      )}

      {/* نکات هفته */}
      {insights.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {caption("نکات هفته")}
          {insights.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  background: K.ember,
                  marginTop: 10,
                  flexShrink: 0,
                }}
              />
              <p style={{ fontSize: 23, color: K.stone, lineHeight: 1.75, fontFamily: FONT, margin: 0, textAlign: "right" }}>
                {clip(it.text, 120)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* نمودارها: دونات + رادار */}
      <div style={{ display: "flex", gap: 20, position: "relative" }}>
        {/* دونات */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "26px 22px",
            background: "rgba(255,255,255,0.52)",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: 26,
            boxSizing: "border-box",
          }}
        >
          {caption("ترکیب هفته")}
          <div style={{ position: "relative", width: 200, height: 200 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={donutUri} width={200} height={200} alt="" style={{ display: "block" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 46, fontWeight: 700, color: K.ink, lineHeight: 1, fontFamily: FONT }}>
                {fa(m.activeDays)}
              </span>
              <span style={{ fontSize: 17, color: K.fog, marginTop: 4, fontFamily: FONT }}>روز فعال</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            {donutLegend.map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 9999, background: l.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 19, color: K.stone, fontFamily: FONT }}>{l.label}</span>
                </div>
                <span style={{ fontSize: 17, color: K.fog, fontFamily: FONT }}>{fa(l.n)} روز</span>
              </div>
            ))}
          </div>
        </div>

        {/* رادار */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "26px 22px",
            background: "rgba(255,255,255,0.52)",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: 26,
            boxSizing: "border-box",
          }}
        >
          {caption("نقشهٔ زندگی")}
          <div style={{ position: "relative", width: RADAR.W, height: RADAR.H }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={radarUri} width={RADAR.W} height={RADAR.H} alt="" style={{ display: "block" }} />
            {radarDims.map((c, i) => {
              const [lx, ly] = radarPoint(i, RADAR.R + 22);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: lx,
                    top: ly,
                    transform: "translate(-50%, -50%)",
                    fontSize: 18,
                    fontWeight: c.total > 0 ? 600 : 500,
                    color: c.total > 0 ? K.stone : K.fog,
                    fontFamily: FONT,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.shortLabel}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* نقل‌قولِ تأمل */}
      {reflectionQuote && (
        <div
          style={{
            display: "flex",
            padding: "26px 30px",
            background: "rgba(199,93,60,0.06)",
            borderRight: `4px solid ${K.ember}`,
            borderRadius: 20,
            boxSizing: "border-box",
          }}
        >
          <p style={{ fontSize: 24, color: K.charcoal, lineHeight: 1.9, fontFamily: FONT, margin: 0, textAlign: "right" }}>
            {reflectionQuote}
          </p>
        </div>
      )}

      {/* فوتر */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 6 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: K.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: K.paper,
            fontSize: 18,
            fontWeight: 800,
            fontFamily: FONT,
          }}
        >
          ه
        </div>
        <span style={{ fontSize: 20, color: K.stone, fontFamily: FONT }}>ساخته‌شده با همسو</span>
      </div>
    </div>
  );
}
