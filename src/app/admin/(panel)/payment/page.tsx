// ─────────────────────────────────────────────────────────────────────────────
// /admin/payment — مدیریت پرداخت و کیف‌پول (DECISION-062)
//   - کارت‌های مرجع دریافت (CRUD)
//   - درخواست‌های شارژ: تأیید (شارژ کیف‌پول + ارتقای پلن از سمت کاربر) / رد
// enforce: payment.read؛ تغییر: payment.manage
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { PaymentCardsManager, type BankCardView } from "@/components/admin/payment/PaymentCardsManager";
import { WalletTopupsManager, type TopupView } from "@/components/admin/payment/WalletTopupsManager";

export const dynamic = "force-dynamic";

export default async function PaymentPage() {
  const ctx = await requirePermission("payment.read");
  const canManage = can(ctx, "payment.manage");

  const cardRows = await prisma.bankCard.findMany({
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const cards: BankCardView[] = cardRows.map((c) => ({
    id: c.id,
    holderName: c.holderName,
    cardNumber: c.cardNumber,
    bankName: c.bankName,
    isActive: c.isActive,
    isDefault: c.isDefault,
    note: c.note,
  }));

  const topupRows = await prisma.walletTransaction.findMany({
    where: { type: "topup" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const userIds = [...new Set(topupRows.map((t) => t.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, username: true, phone: true, email: true, paymentCardNumber: true, paymentCardNumber2: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const rank = (s: string) => (s === "pending" ? 0 : 1);
  const topups: TopupView[] = topupRows
    .map((t) => {
      const u = userMap.get(t.userId);
      return {
        id: t.id,
        refCode: t.refCode,
        amount: t.amount,
        status: t.status,
        payerCardSnapshot: t.payerCardSnapshot,
        adminNote: t.adminNote,
        createdAt: t.createdAt.toISOString(),
        reviewedAt: t.reviewedAt ? t.reviewedAt.toISOString() : null,
        user: u
          ? {
              id: u.id,
              name: u.displayName || (u.username ? `@${u.username}` : null),
              phone: u.phone,
              email: u.email,
              registeredCard: u.paymentCardNumber,
              registeredCard2: u.paymentCardNumber2,
            }
          : null,
      };
    })
    .sort((a, b) => rank(a.status) - rank(b.status) || (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-ink">مدیریت پرداخت</h1>
        <p className="text-sm text-stone mt-1 leading-relaxed max-w-xl">
          کارتِ مرجعِ دریافت را تنظیم می‌کنی و درخواست‌های شارژِ کیف‌پولِ کاربران را تأیید/رد می‌کنی. تأیید، کیف‌پول کاربر را شارژ می‌کند و کاربر با موجودی، پلن می‌خرد.
        </p>
      </header>

      <div className="rounded-xl bg-mist/15 border border-mist/30 px-4 py-3 text-[12px] leading-relaxed text-charcoal">
        <div className="font-semibold text-ink mb-1">این بخش چطور کار می‌کند؟</div>
        کاربر مبلغی به «کارت مرجع» واریز می‌کند و یک «شناسهٔ یکتا» می‌گیرد. اینجا با تطبیقِ آن شناسه و «کارتِ ثبت‌شدهٔ کاربر» (مبدأ واریز)، شارژ را تأیید می‌کنی؛ کیف‌پول بلافاصله شارژ می‌شود و به کاربر اعلان می‌رود. درگاهِ پرداختِ آینده هم همین کیف‌پول را شارژ خواهد کرد — بدون تداخل.
      </div>

      <PaymentCardsManager cards={cards} canManage={canManage} />
      <WalletTopupsManager topups={topups} canManage={canManage} />
    </div>
  );
}
