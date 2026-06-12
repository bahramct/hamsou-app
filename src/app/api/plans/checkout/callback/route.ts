// ─────────────────────────────────────────────────────────────────────────────
// GET /api/plans/checkout/callback — بازگشت از درگاه برای خرید مستقیم پلن (DECISION-073)
// آینهٔ /api/wallet/topup/callback، اما به‌جای شارژ کیف‌پول، پلن را اعمال می‌کند.
//   • مبلغ از tx (هرگز از query) · idempotent (گارد status) · redirect به /plans?pay=…
//   • کوکی سشن در redirect cross-site نمی‌آید → هندلر خودگارد است (authority + verify).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getActivePaymentGateway } from "@/lib/payment/gateway";
import { getPaymentAdapterForGateway } from "@/lib/adapters";
import { findTopupByAuthority } from "@/lib/wallet/wallet";
import { applyGatewayPlanPurchase, failGatewayPlanPurchase } from "@/lib/plans/purchase";
import { createNotification } from "@/lib/notifications/server";

function redirectTo(req: NextRequest, pay: string, ref?: string): NextResponse {
  const url = new URL("/plans", req.url);
  url.searchParams.set("pay", pay);
  if (ref) url.searchParams.set("ref", ref);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const authority = req.nextUrl.searchParams.get("Authority") ?? req.nextUrl.searchParams.get("authority");
  const status = req.nextUrl.searchParams.get("Status") ?? req.nextUrl.searchParams.get("status");

  if (!authority) return redirectTo(req, "error");

  const tx = await findTopupByAuthority(authority);
  if (!tx || tx.type !== "purchase") return redirectTo(req, "error");

  if (status !== "OK") {
    await failGatewayPlanPurchase({ authority, reason: "پرداخت توسط کاربر لغو یا ناموفق شد." });
    return redirectTo(req, "cancel");
  }

  // قبلاً نهایی شده (refresh / بازگشت دوباره)
  if (tx.status === "completed") return redirectTo(req, "success", tx.gatewayRefId ?? undefined);
  if (tx.status === "rejected") return redirectTo(req, "failed");

  const gw = await getActivePaymentGateway();
  if (!gw) return redirectTo(req, "failed");

  let adapter;
  try {
    adapter = getPaymentAdapterForGateway(gw);
  } catch (err) {
    console.error("[plans/callback] ساختِ آداپتر ناموفق:", err);
    return redirectTo(req, "failed");
  }

  // مبلغ روی tx علامت‌دار (منفی) ذخیره شده؛ درگاه مبلغ مثبت می‌خواهد
  const verify = await adapter.verifyPayment({ amount: Math.abs(tx.amount), authority });
  if (!verify.ok) {
    await failGatewayPlanPurchase({ authority, reason: verify.error });
    return redirectTo(req, "failed");
  }

  const result = await applyGatewayPlanPurchase({
    authority,
    refId: verify.refId,
    cardPan: verify.cardPan ?? null,
  });
  if (!result.ok) {
    await failGatewayPlanPurchase({ authority, reason: result.error });
    return redirectTo(req, "failed");
  }

  // اعلان ماندگار فقط بار اول (قاعدهٔ طلایی createNotification)
  if (!result.alreadyDone) {
    await createNotification({
      userId: result.userId,
      type: "plan.changed",
      data: { plan: result.planKey, planLabel: result.planLabel },
    }).catch((e) => console.error("[plans/callback] اعلان ناموفق:", e));
  }

  return redirectTo(req, "success", verify.refId);
}
