"use client";

// ─────────────────────────────────────────────────────────────────────────────
// WalletReceiptCanvas — رسید رسمی قابل‌دانلود (DECISION-062)
// طراحی فاکتور مدرن: هدر برند + مبلغ + جزئیات + QR code + footer.
// DIVِ استایل‌شده که با html-to-image (toPng) به PNG تبدیل می‌شود.
// qrDataUrl توسط WalletReceiptModal پیش از رندر تولید می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

export interface ReceiptData {
  refCode: string;
  type: string; // topup | purchase | adjust
  amount: number;
  balanceAfter: number | null;
  planLabel: string | null;
  cycle: string | null;
  date: string; // ISO
  userName: string;
}

const K = {
  ink: "#1A1A1F",
  stone: "#6B6657",
  fog: "#BDB6A7",
  bone: "#EAE4D6",
  paper: "#F8F5EE",
  sage: "#7A8471",
  sageDeep: "#586152",
  sageBg: "rgba(122,132,113,0.10)",
  accent: "#3D4438",
  divider: "rgba(0,0,0,0.07)",
} as const;

const FONT = '"PelakFA", Tahoma, sans-serif';
const fa = (n: number) => n.toLocaleString("fa-IR");

function faDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch { return iso; }
}
function faTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function typeTitle(type: string, planLabel: string | null, cycle: string | null): string {
  if (type === "purchase") {
    const c = cycle === "annual" ? "سالانه" : "ماهانه";
    return planLabel ? `خرید اشتراک ${planLabel} (${c})` : "خرید اشتراک";
  }
  if (type === "adjust") return "اصلاح موجودی";
  return "شارژ کیف‌پول";
}

function typeIcon(type: string): string {
  if (type === "purchase") return "✦";
  return "⬆";
}

export function WalletReceiptCanvas({
  data,
  qrDataUrl,
  innerRef,
}: {
  data: ReceiptData;
  qrDataUrl?: string;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  const receiptTitle = typeTitle(data.type, data.planLabel, data.cycle);

  return (
    <div
      ref={innerRef}
      dir="rtl"
      style={{
        width: 680,
        background: K.paper,
        fontFamily: FONT,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        borderRadius: 0,
      }}
    >
      {/* ── نوار بالایی رنگی ──────────────────────────────────────────────── */}
      <div style={{ background: K.accent, padding: "28px 40px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(255,255,255,0.15)", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 22, fontWeight: 800, fontFamily: FONT,
          }}>ه</div>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: FONT, letterSpacing: "-0.5px" }}>همسو</span>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: FONT }}>رسید پرداخت</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: FONT, direction: "ltr", marginTop: 2 }}>{data.refCode}</div>
        </div>
      </div>

      {/* ── بدنه اصلی ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 40px 36px" }}>

        {/* ─ نشان وضعیت ─ */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 0 28px", borderBottom: `1px solid ${K.divider}` }}>
          <div style={{
            width: 72, height: 72, borderRadius: 9999,
            background: K.sageBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 14,
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.5l5 5L20 6.5" stroke={K.sageDeep} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: K.sageDeep, fontFamily: FONT, marginBottom: 6 }}>
            {typeIcon(data.type)} {receiptTitle}
          </div>
          {/* مبلغ بزرگ */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 52, fontWeight: 800, color: K.ink, fontFamily: FONT, lineHeight: 1 }}>{fa(data.amount)}</span>
            <span style={{ fontSize: 20, color: K.stone, fontFamily: FONT }}>تومان</span>
          </div>
        </div>

        {/* ─ جدول جزئیات ─ */}
        <div style={{ marginTop: 24 }}>
          <DetailRow label="شناسهٔ پیگیری" value={data.refCode} mono />
          <DetailRow label="تاریخ صدور" value={`${faDate(data.date)}`} />
          <DetailRow label="ساعت" value={faTime(data.date)} />
          <DetailRow label="نام پرداخت‌کننده" value={data.userName} />
          {data.balanceAfter != null && (
            <DetailRow label="موجودی پس از تراکنش" value={`${fa(data.balanceAfter)} تومان`} last />
          )}
        </div>

        {/* ─ ردیف QR + متن ─ */}
        <div style={{
          marginTop: 28,
          paddingTop: 24,
          borderTop: `1px solid ${K.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}>
          {/* متن سمت راست */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: K.ink, fontFamily: FONT, marginBottom: 6 }}>
              این رسید توسط سیستم همسو صادر شده است.
            </div>
            <div style={{ fontSize: 11, color: K.fog, fontFamily: FONT, lineHeight: 1.7 }}>
              شناسهٔ پیگیری را جهت استعلام نزد خود نگه‌دار.<br />
              پشتیبانی: hamsoo.app
            </div>
          </div>
          {/* QR code */}
          {qrDataUrl && (
            <div style={{
              padding: 8,
              background: "#fff",
              borderRadius: 10,
              border: `1px solid ${K.bone}`,
              flexShrink: 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Code" width={72} height={72} style={{ display: "block" }} />
            </div>
          )}
        </div>
      </div>

      {/* ── خط‌های تزئینی پایین (مانند بارکد دستی) ─────────────────────── */}
      <BarcodeFoot />
    </div>
  );
}

function DetailRow({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "13px 0",
      borderBottom: last ? "none" : `1px solid ${K.divider}`,
    }}>
      <span style={{ fontSize: 14, color: K.stone, fontFamily: FONT }}>{label}</span>
      <span style={{
        fontSize: 14, color: K.ink, fontFamily: FONT, fontWeight: 600,
        direction: mono ? "ltr" : "rtl",
        letterSpacing: mono ? "0.03em" : "normal",
      }}>{value}</span>
    </div>
  );
}

function BarcodeFoot() {
  const bars = [3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1];
  let x = 0;
  const items: { x: number; w: number; idx: number }[] = [];
  bars.forEach((w, i) => {
    items.push({ x, w, idx: i });
    x += w * 3 + 2;
  });
  const totalW = x;

  return (
    <div style={{ background: K.accent, height: 36, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <svg width={totalW} height={22} viewBox={`0 0 ${totalW} 22`} style={{ opacity: 0.45 }}>
        {items.map(({ x: bx, w, idx }) =>
          idx % 2 === 0 ? (
            <rect key={idx} x={bx} y={0} width={w * 3} height={22} fill="#fff" rx={0.5} />
          ) : null
        )}
      </svg>
    </div>
  );
}
