// ─────────────────────────────────────────────────────────────────────────────
// POST /api/wallet/topup — درخواست شارژ کیف‌پول (DECISION-062)
// body: { amount, cardSlot: 1|2 } — cardSlot مشخص می‌کند کدام کارت برای واریز استفاده می‌شود
// - نیازمند کارتِ ثبت‌شدهٔ کاربر (برای صحت‌سنجی توسط ادمین)
// - نیازمند وجود کارتِ مرجعِ فعال (مقصد واریز)
// - یک WalletTransaction(pending) با refCode یکتا می‌سازد؛ کارت مرجع را برمی‌گرداند
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { onlyDigits } from "@/lib/utils/digits";
import { getDefaultBankCard } from "@/lib/payment/cards";
import { createTopupRequest } from "@/lib/wallet/wallet";

const MIN_TOPUP = 10_000;

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { amount?: unknown; cardSlot?: unknown } | null;
  const amount = typeof body?.amount === "number" ? Math.floor(body.amount) : parseInt(onlyDigits(String(body?.amount ?? "")), 10);
  if (!amount || Number.isNaN(amount) || amount < MIN_TOPUP) {
    return NextResponse.json({ error: `حداقل مبلغ شارژ ${MIN_TOPUP.toLocaleString("fa-IR")} تومان است.` }, { status: 400 });
  }

  const cardSlot = body?.cardSlot === 2 ? 2 : 1;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { paymentCardNumber: true, paymentCardNumber2: true },
  });

  const selectedCard = cardSlot === 2 ? user?.paymentCardNumber2 : user?.paymentCardNumber;
  if (!selectedCard) {
    const hasOtherCard = cardSlot === 2 ? user?.paymentCardNumber : user?.paymentCardNumber2;
    if (!hasOtherCard) {
      return NextResponse.json({ error: "اول شماره کارت خود را در پروفایل ثبت کن.", needCard: true }, { status: 400 });
    }
    return NextResponse.json({ error: "کارت انتخاب‌شده ثبت نشده است.", needCard: true }, { status: 400 });
  }

  const bankCard = await getDefaultBankCard();
  if (!bankCard) {
    return NextResponse.json({ error: "در حال حاضر امکان شارژ نیست (کارت مقصد تنظیم نشده)." }, { status: 503 });
  }

  const tx = await createTopupRequest({
    userId: session.userId,
    amount,
    payerCardSnapshot: selectedCard,
    bankCardId: bankCard.id,
  });

  return NextResponse.json({
    ok: true,
    refCode: tx.refCode,
    amount,
    selectedCard,
    card: { cardNumber: bankCard.cardNumber, holderName: bankCard.holderName, bankName: bankCard.bankName },
  });
}
