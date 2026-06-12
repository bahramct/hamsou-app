// ─────────────────────────────────────────────────────────────────────────────
// POST /api/plans/checkout/gateway — خرید مستقیم پلن از درگاه (DECISION-073)
// body: { planKey, cycle, code? } — قیمت server-side (quotePlanPurchase).
// مستقل از کیف‌پول: مبلغ مستقیم در درگاه پرداخت می‌شود؛ موجودی دست نمی‌خورد.
//   ۱. quote (پلن/قیمت/تخفیف/گارد downgrade)
//   ۲. WalletTransaction(type=purchase, gateway, pending)
//   ۳. requestPayment → authority + startPayUrl (کلاینت redirect می‌کند)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import { getActivePaymentGateway } from "@/lib/payment/gateway";
import { getPaymentAdapterForGateway } from "@/lib/adapters";
import { attachAuthority } from "@/lib/wallet/wallet";
import { quotePlanPurchase, createGatewayPurchase } from "@/lib/plans/purchase";
import type { BillingCycle } from "@/lib/plans/discount-shared";

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const planKey = typeof b?.planKey === "string" ? b.planKey : "";
  const cycle: BillingCycle = b?.cycle === "annual" ? "annual" : "monthly";
  const code = typeof b?.code === "string" ? b.code : undefined;

  const quote = await quotePlanPurchase(session.userId, planKey, cycle, code);
  if (!quote.ok) return NextResponse.json({ error: quote.error }, { status: 400 });

  const gw = await getActivePaymentGateway();
  if (!gw) {
    return NextResponse.json({ error: "در حال حاضر پرداخت آنلاین فعال نیست." }, { status: 503 });
  }

  let adapter;
  try {
    adapter = getPaymentAdapterForGateway(gw);
  } catch (err) {
    console.error("[plans/checkout] ساختِ آداپتر ناموفق:", err);
    return NextResponse.json({ error: "درگاه پرداخت به‌درستی تنظیم نشده است." }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { phone: true } });

  const tx = await createGatewayPurchase({
    userId: session.userId,
    amount: quote.finalPrice,
    gateway: gw.provider,
    planKey: quote.planKey,
    cycle: quote.cycle,
    appliedCode: quote.appliedCode,
  });

  const callbackUrl = `${getAppBaseUrl()}/api/plans/checkout/callback`;
  const result = await adapter.requestPayment({
    amount: quote.finalPrice,
    description: `خرید پلن ${quote.planLabel} همسو (${tx.refCode})`,
    callbackUrl,
    mobile: user?.phone ?? undefined,
  });

  if (!result.ok) {
    await prisma.walletTransaction
      .update({ where: { id: tx.id }, data: { status: "rejected", adminNote: result.error } })
      .catch(() => {});
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  await attachAuthority(tx.id, result.authority);

  return NextResponse.json({ ok: true, startPayUrl: result.startPayUrl });
}
