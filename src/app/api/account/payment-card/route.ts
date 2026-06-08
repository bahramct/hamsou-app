// ─────────────────────────────────────────────────────────────────────────────
// /api/account/payment-card — مدیریت کارت‌های پرداختِ کاربر (DECISION-062)
// PUT {cardNumber, slot: 1|2} — ثبت/ویرایش کارت در اسلات مشخص
// DELETE {slot: 1|2} — حذف کارت
// حداکثر ۲ کارت. کارت‌ها برای تطبیق مبدأ واریز توسط ادمین استفاده می‌شوند.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { onlyDigits } from "@/lib/utils/digits";

export async function PUT(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { cardNumber?: unknown; slot?: unknown } | null;
  const raw = typeof body?.cardNumber === "string" ? onlyDigits(body.cardNumber) : "";
  if (raw.length !== 16) {
    return NextResponse.json({ error: "شماره کارت باید ۱۶ رقم باشد." }, { status: 400 });
  }

  const slot = body?.slot === 2 ? 2 : 1;
  const field = slot === 2 ? "paymentCardNumber2" : "paymentCardNumber";

  await prisma.user.update({ where: { id: session.userId }, data: { [field]: raw } });
  return NextResponse.json({ ok: true, cardNumber: raw, slot });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { slot?: unknown } | null;
  const slot = body?.slot === 2 ? 2 : 1;
  const field = slot === 2 ? "paymentCardNumber2" : "paymentCardNumber";

  await prisma.user.update({ where: { id: session.userId }, data: { [field]: null } });
  return NextResponse.json({ ok: true, slot });
}
