// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet/receipt/[txId] — دادهٔ رسید یک تراکنش (DECISION-062)
// فقط تراکنشِ خودِ کاربر و فقط approved/completed. UI با این داده canvas رسید را می‌سازد.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ txId: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { txId } = await params;
  const tx = await prisma.walletTransaction.findUnique({ where: { id: txId } });
  if (!tx || tx.userId !== session.userId) {
    return NextResponse.json({ error: "تراکنش یافت نشد." }, { status: 404 });
  }
  if (tx.status !== "approved" && tx.status !== "completed") {
    return NextResponse.json({ error: "رسید فقط برای تراکنش‌های موفق صادر می‌شود." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { displayName: true, username: true },
  });

  let planLabel: string | null = null;
  if (tx.type === "purchase" && tx.planKey) {
    const plan = await prisma.plan.findUnique({ where: { key: tx.planKey }, select: { label: true } });
    planLabel = plan?.label ?? tx.planKey;
  }

  return NextResponse.json({
    ok: true,
    receipt: {
      refCode: tx.refCode,
      type: tx.type, // topup | purchase | adjust
      amount: Math.abs(tx.amount),
      balanceAfter: tx.balanceAfter,
      planLabel,
      cycle: tx.cycle,
      date: (tx.reviewedAt ?? tx.createdAt).toISOString(),
      userName: user?.displayName || (user?.username ? `@${user.username}` : "کاربر همسو"),
    },
  });
}
