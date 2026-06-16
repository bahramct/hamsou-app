// ─────────────────────────────────────────────────────────────────────────────
// PlanTile — تایلِ «پلن و کیف‌پول» (TASK-28؛ مو‌به‌موی dashboard-unified.html: t-plan)
// بَجِ پلن + روزهای مانده + موجودیِ کیف + میان‌برِ کیف‌پول/پشتیبانی/ارتقا.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";

export interface PlanTileData {
  planLabel: string;
  tone: "free" | "plus" | "pro";
  daysLeft: number | null;
  walletBalance: number;
  cycleLabel: string | null;
}

function fa(n: number): string {
  return n.toLocaleString("fa-IR");
}

function daysLabel(daysLeft: number | null): string | null {
  if (daysLeft == null) return null;
  if (daysLeft === 0) return "امروز منقضی می‌شود";
  return `${fa(daysLeft)} روز مانده`;
}

export function PlanTile({ data }: { data: PlanTileData }) {
  const dl = daysLabel(data.daysLeft);
  return (
    <div className="dsh-tile t-plan glass">
      <div className="dsh-lbl">پلن و کیف‌پول</div>

      <div className="dsh-plan-top">
        <span className={`dsh-plan-badge ${data.tone}`}>{data.planLabel}</span>
        {dl && <span className="dsh-plan-left">{dl}</span>}
      </div>

      <div className="dsh-plan-wallet">
        <span className="amt fa-num">{fa(data.walletBalance)}</span>
        <span className="unit">تومان موجودی</span>
      </div>
      {data.cycleLabel && <p className="dsh-plan-sub">{data.cycleLabel}</p>}

      {/* کیف‌پول و پشتیبانی در پروفایل‌اند (ریدیزاین): کیف‌پول → بخشِ مالی،
          پشتیبانی → دراورِ کشویی با پارامتر (نه صفحهٔ /support). */}
      <div className="dsh-plan-links">
        <Link href="/settings/profile#finance">کیف‌پول</Link>
        <Link href="/settings/profile?support=1">پشتیبانی</Link>
        <Link href="/plans">ارتقا / تمدید</Link>
      </div>
    </div>
  );
}
