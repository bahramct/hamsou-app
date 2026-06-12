// ─────────────────────────────────────────────────────────────────────────────
// /wallet — کیف‌پول کاربر (DECISION-062)
// موجودی + کارتِ پرداخت + تاریخچه + شارژ + رسید. خرید پلن در /plans از همین موجودی.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { WalletPanel, type WalletTx } from "@/components/features/wallet/WalletPanel";
import { WalletReturnToast } from "@/components/features/wallet/WalletReturnToast";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { walletBalance: true, paymentCardNumber: true },
  });
  if (!user) redirect("/login");

  const txs = await prisma.walletTransaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const transactions: WalletTx[] = txs.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    status: t.status,
    refCode: t.refCode,
    planKey: t.planKey,
    cycle: t.cycle,
    adminNote: t.adminNote,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <AppShell>
      <WalletReturnToast />
      <div className="flex-1 max-w-2xl mx-auto w-full px-5 py-10 sm:py-14 animate-fade-up">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-ink">کیف‌پول</h1>
          <p className="text-sm text-fog mt-1 leading-relaxed">
            کیف‌پولت را شارژ کن و هر زمان خواستی با موجودی، پلن دلخواه را بخر.
          </p>
        </div>

        <WalletPanel
          balance={user.walletBalance}
          paymentCardNumber={user.paymentCardNumber}
          transactions={transactions}
        />
      </div>
    </AppShell>
  );
}
