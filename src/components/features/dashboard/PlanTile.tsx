// ─────────────────────────────────────────────────────────────────────────────
// PlanTile — تایلِ «پلن و کیف‌پول» (TASK-28؛ مو‌به‌موی dashboard-unified.html: t-plan)
// بَجِ پلن + روزهای مانده + موجودیِ کیف + میان‌برِ کیف‌پول/پشتیبانی/ارتقا.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { OpenSupportDrawerLink } from "@/components/features/support/OpenSupportDrawerLink";

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
      <div className="dsh-head">
        <span className="tile-ic ic-deepsage" aria-hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg></span>
        <div className="dsh-lbl">پلن و کیف‌پول</div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="dsh-plan-top">
          <span className={`dsh-plan-badge ${data.tone}`}>{data.planLabel}</span>
          {dl && <span className="dsh-plan-left">{dl}</span>}
        </div>

        <div className="dsh-plan-wallet">
          <span className="amt fa-num">{fa(data.walletBalance)}</span>
          <span className="unit">تومان موجودی</span>
        </div>
        {data.cycleLabel && <p className="dsh-plan-sub">{data.cycleLabel}</p>}
      </div>

      {/* کیف‌پول → بخشِ مالیِ پروفایل · پشتیبانی → دراورِ همین‌جا (DECISION-102 #1) ·
          ارتقا → /plans. */}
      <div className="dsh-plan-links">
        <Link href="/settings/profile#finance">کیف‌پول</Link>
        <OpenSupportDrawerLink>پشتیبانی</OpenSupportDrawerLink>
        <Link href="/plans">ارتقا / تمدید</Link>
      </div>
    </div>
  );
}
