// ─────────────────────────────────────────────────────────────────────────────
// PlanTile — تایلِ «پلن و اشتراک» (بازطراحی DECISION-096) — نمایشی + لینک به /plans
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";

interface Props {
  planLabel: string;
  planKey: string; // FREE | PLUS | PRO
  cycle: string | null; // monthly | annual
  daysLeft: number | null;
}

function fa(n: number): string {
  return n.toLocaleString("fa-IR");
}

export function PlanTile({ planLabel, planKey, cycle, daysLeft }: Props) {
  const isPaid = planKey !== "FREE";
  const totalDays = cycle === "annual" ? 365 : 30;
  const hasBar = isPaid && daysLeft != null;
  const pct = hasBar ? Math.max(4, Math.min(100, Math.round((daysLeft! / totalDays) * 100))) : 0;

  const tag = isPaid
    ? cycle === "annual" ? "سالانه فعال" : cycle === "monthly" ? "ماهانه فعال" : "فعال"
    : "رایگان";

  return (
    <section className="pf-tile pf-t-plan glass">
      <div className="pf-tile-head">
        <div className="pf-tile-ic ic-plan">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        </div>
        <div>
          <h3>پلن و اشتراک</h3>
          <div className="sub">وضعیت اشتراک فعلی</div>
        </div>
      </div>

      <div className="pf-plan-now">
        <span className="name">{planLabel}</span>
        <span className="tag">{tag}</span>
      </div>

      {hasBar ? (
        <>
          <div className="pf-plan-bar"><i style={{ width: `${pct}%` }} /></div>
          <div className="pf-plan-meta fa-num">{fa(daysLeft!)} روز از {fa(totalDays)} روز باقی مانده</div>
        </>
      ) : (
        <div className="pf-plan-meta">{isPaid ? "بدون تاریخِ انقضا" : "می‌توانی هر زمان به پلاس یا پرو ارتقا بدهی."}</div>
      )}

      <div className="pf-cta-foot">
        <Link href="/plans" className="pf-row-link">
          {isPaid ? "مدیریت و ارتقای پلن" : "مشاهدهٔ پلن‌ها"}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>
    </section>
  );
}
