// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet — موجودی + کارتِ کاربر + تاریخچهٔ تراکنش‌ها (DECISION-062)
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { walletBalance: true, paymentCardNumber: true },
  });
  if (!user) return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });

  const txs = await prisma.walletTransaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    balance: user.walletBalance,
    paymentCardNumber: user.paymentCardNumber,
    transactions: txs.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      status: t.status,
      refCode: t.refCode,
      planKey: t.planKey,
      cycle: t.cycle,
      adminNote: t.adminNote,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
