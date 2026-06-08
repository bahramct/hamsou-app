// ─────────────────────────────────────────────────────────────────────────────
// POST /api/wallet/purchase — خرید پلن از موجودی کیف‌پول (DECISION-062)
// body: { planKey, cycle, code? } — مبلغ server-side محاسبه می‌شود (purchasePlan).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { purchasePlan } from "@/lib/plans/purchase";
import type { BillingCycle } from "@/lib/plans/discount-shared";

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const planKey = typeof b?.planKey === "string" ? b.planKey : "";
  const cycle: BillingCycle = b?.cycle === "annual" ? "annual" : "monthly";
  const code = typeof b?.code === "string" ? b.code : undefined;

  const result = await purchasePlan(session.userId, planKey, cycle, code);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, needTopup: result.needTopup ?? false, shortBy: result.shortBy ?? null },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    txId: result.txId,
    refCode: result.refCode,
    plan: result.plan,
    cycle: result.cycle,
    amount: result.amount,
    balanceAfter: result.balanceAfter,
    expiresAt: result.expiresAt.toISOString(),
  });
}
