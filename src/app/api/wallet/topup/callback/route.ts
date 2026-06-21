// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet/topup/callback — بازگشت از درگاهِ پرداخت (DECISION-071)
// زرین‌پال با ?Authority=...&Status=OK|NOK به اینجا redirect می‌کند.
//   ۱. tx را با authority پیدا می‌کند (مبلغ از همین tx — هرگز از query)
//   ۲. Status=NOK → fail + redirect /settings/profile?pay=cancel
//   ۳. verifyPayment روی آداپتر → موفق: confirmGatewayTopup (اتمیک، idempotent) +
//      اعلان wallet.topup.approved + redirect /settings/profile?pay=success
//   ۴. verify ناموفق → fail + redirect /settings/profile?pay=failed
//
// امنیت: شارژ فقط پس از verify؛ idempotent (گاردِ status)؛ مبلغ از tx.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getActivePaymentGateway } from "@/lib/payment/gateway";
import { getPaymentAdapterForGateway } from "@/lib/adapters";
import { findTopupByAuthority, confirmGatewayTopup, failGatewayTopup } from "@/lib/wallet/wallet";
import { createNotification } from "@/lib/notifications/server";

function redirectTo(req: NextRequest, pay: string, ref?: string): NextResponse {
  const url = new URL("/settings/profile", req.url);
  url.searchParams.set("pay", pay);
  if (ref) url.searchParams.set("ref", ref);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const authority = req.nextUrl.searchParams.get("Authority") ?? req.nextUrl.searchParams.get("authority");
  const status = req.nextUrl.searchParams.get("Status") ?? req.nextUrl.searchParams.get("status");

  if (!authority) return redirectTo(req, "error");

  const tx = await findTopupByAuthority(authority);
  if (!tx || tx.type !== "topup") return redirectTo(req, "error");

  // کاربر در درگاه لغو/ناموفق کرد
  if (status !== "OK") {
    await failGatewayTopup({ authority, reason: "پرداخت توسط کاربر لغو یا ناموفق شد." });
    return redirectTo(req, "cancel");
  }

  // قبلاً تأیید شده (refresh/برگشتِ دوباره) → بدونِ verify دوباره، موفق
  if (tx.status === "approved") return redirectTo(req, "success", tx.gatewayRefId ?? undefined);
  if (tx.status === "rejected") return redirectTo(req, "failed");

  const gw = await getActivePaymentGateway();
  if (!gw) return redirectTo(req, "failed");

  let adapter;
  try {
    adapter = getPaymentAdapterForGateway(gw);
  } catch (err) {
    console.error("[wallet/callback] ساختِ آداپتر ناموفق:", err);
    return redirectTo(req, "failed");
  }

  const verify = await adapter.verifyPayment({ amount: tx.amount, authority });
  if (!verify.ok) {
    await failGatewayTopup({ authority, reason: verify.error });
    return redirectTo(req, "failed");
  }

  const result = await confirmGatewayTopup({
    authority,
    refId: verify.refId,
    cardPan: verify.cardPan ?? null,
  });
  if (!result.ok) {
    await failGatewayTopup({ authority, reason: result.error });
    return redirectTo(req, "failed");
  }

  // اعلانِ ماندگار فقط بارِ اول (نه روی callbackِ تکراری) — قاعدهٔ طلایی createNotification
  if (!result.alreadyDone) {
    await createNotification({
      userId: result.userId,
      type: "wallet.topup.approved",
      data: { amount: result.amount, balanceAfter: result.balanceAfter, refCode: result.refCode, txId: tx.id },
    }).catch((e) => console.error("[wallet/callback] اعلان ناموفق:", e));
  }

  return redirectTo(req, "success", verify.refId);
}
