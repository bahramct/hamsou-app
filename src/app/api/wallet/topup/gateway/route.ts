// ─────────────────────────────────────────────────────────────────────────────
// POST /api/wallet/topup/gateway — شروعِ شارژِ آنلاینِ کیف‌پول از درگاه (DECISION-071)
// body: { amount } — مبلغ به تومان (≥ MIN_TOPUP).
//   ۱. درگاهِ فعال را resolve می‌کند (نبود → ۵۰۳)
//   ۲. یک WalletTransaction(type=topup, gateway, pending) می‌سازد
//   ۳. requestPayment روی آداپتر → authority + startPayUrl
//   ۴. authority را روی tx ذخیره و startPayUrl را برمی‌گرداند (کلاینت redirect می‌کند)
// نیازی به کارتِ ثبت‌شدهٔ کاربر ندارد (برخلافِ کارت‌به‌کارتِ دستی).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { onlyDigits } from "@/lib/utils/digits";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import { getActivePaymentGateway } from "@/lib/payment/gateway";
import { getPaymentAdapterForGateway } from "@/lib/adapters";
import { createGatewayTopup, attachAuthority } from "@/lib/wallet/wallet";

const MIN_TOPUP = 10_000;

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { amount?: unknown } | null;
  const amount =
    typeof body?.amount === "number" ? Math.floor(body.amount) : parseInt(onlyDigits(String(body?.amount ?? "")), 10);
  if (!amount || Number.isNaN(amount) || amount < MIN_TOPUP) {
    return NextResponse.json(
      { error: `حداقل مبلغ شارژ ${MIN_TOPUP.toLocaleString("fa-IR")} تومان است.` },
      { status: 400 }
    );
  }

  const gw = await getActivePaymentGateway();
  if (!gw) {
    return NextResponse.json({ error: "در حال حاضر پرداخت آنلاین فعال نیست." }, { status: 503 });
  }

  let adapter;
  try {
    adapter = getPaymentAdapterForGateway(gw);
  } catch (err) {
    console.error("[wallet/gateway] ساختِ آداپتر ناموفق:", err);
    return NextResponse.json({ error: "درگاه پرداخت به‌درستی تنظیم نشده است." }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { phone: true } });

  // تراکنشِ pending پیش از هدایت به درگاه
  const tx = await createGatewayTopup({ userId: session.userId, amount, gateway: gw.provider });

  const callbackUrl = `${getAppBaseUrl()}/api/wallet/topup/callback`;
  const result = await adapter.requestPayment({
    amount,
    description: `شارژ کیف‌پول همسو (${tx.refCode})`,
    callbackUrl,
    mobile: user?.phone ?? undefined,
  });

  if (!result.ok) {
    // request شکست خورد و authority‌ای نگرفتیم → tx را مستقیم رد می‌کنیم
    await prisma.walletTransaction
      .update({ where: { id: tx.id }, data: { status: "rejected", adminNote: result.error } })
      .catch(() => {});
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  await attachAuthority(tx.id, result.authority);

  return NextResponse.json({ ok: true, startPayUrl: result.startPayUrl });
}
