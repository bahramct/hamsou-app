"use client";

// ShareCardCanvas — کارتِ ۱۲۰۰×۶۳۰ برای دانلود (رندر مرورگر — بدون Satori)
// فونت PelakFA از globals.css بارگذاری می‌شود → فارسی/RTL کاملاً درست.

import type { ShareImageData } from "@/lib/reports/share-image";

const K = {
  ink: "#1A1A1F",
  stone: "#6B6657",
  fog: "#BDB6A7",
  bone: "#EAE4D6",
  paper: "#F5F2EB",
  sage: "#7A8471",
  ember: "#C75D3C",
  mist: "#9BB4C7",
} as const;

const FONT = '"PelakFA", Tahoma, sans-serif';

function fa(n: number): string {
  return n.toLocaleString("fa-IR");
}

interface Props {
  data: ShareImageData;
}

export function ShareCardCanvas({ data }: Props) {
  const m = data.metrics;
  const metrics = [
    { value: m.activeDays, label: "روز فعال" },
    { value: m.doneCount, label: "انجام شد" },
    { value: m.gapDays, label: "روز گپ" },
  ];

  return (
    <div
      dir="rtl"
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #F5F2EB 0%, #EAE4D6 100%)",
        padding: "72px 80px",
        fontFamily: FONT,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* blob تزئینی چپ بالا */}
      <div
        style={{
          position: "absolute",
          top: -160,
          left: -120,
          width: 420,
          height: 420,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(122,132,113,0.28) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* blob تزئینی راست پایین */}
      <div
        style={{
          position: "absolute",
          bottom: -180,
          right: -100,
          width: 460,
          height: 460,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(155,180,199,0.26) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* هدر: برند + "گزارش هفتگی" */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: K.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: K.paper,
              fontSize: 30,
              fontWeight: 800,
              fontFamily: FONT,
            }}
          >
            ه
          </div>
          <span style={{ fontSize: 34, fontWeight: 700, color: K.ink, fontFamily: FONT }}>همسو</span>
        </div>
        <span style={{ fontSize: 24, color: K.stone, fontFamily: FONT }}>گزارش هفتگی</span>
      </div>

      {/* بازهٔ تاریخ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
        <span style={{ fontSize: 30, color: K.stone, fontFamily: FONT }}>یک هفته از مسیر</span>
        <span style={{ fontSize: 60, fontWeight: 800, color: K.ink, fontFamily: FONT, lineHeight: 1.1 }}>
          {data.jalaliStart} تا {data.jalaliEnd}
        </span>
      </div>

      {/* متریک‌های سه‌گانه */}
      <div style={{ display: "flex", gap: 24, position: "relative" }}>
        {metrics.map((mt) => (
          <div
            key={mt.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "28px 0",
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(0,0,0,0.05)",
              borderRadius: 28,
            }}
          >
            <span style={{ fontSize: 64, fontWeight: 800, color: K.ink, fontFamily: FONT }}>{fa(mt.value)}</span>
            <span style={{ fontSize: 24, color: K.stone, fontFamily: FONT }}>{mt.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
