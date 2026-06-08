// ─────────────────────────────────────────────────────────────────────────────
// plans/purchase.ts — خرید پلن از موجودی کیف‌پول (DECISION-062)
//
// مبلغ همیشه server-side محاسبه می‌شود (applyDiscount). تغییر موجودی/پلن اتمیک.
//
// تمدید هوشمند (انتقال زمان):
//   - پلن فعالِ هر نوع (PLUS یا PRO) → مدت جدید از انتهای پلن فعلی اضافه می‌شود.
//   - پلن منقضی یا FREE → از حالا.
//   مثال: PLUS 15 روز مانده + خرید PRO ماهانه = PRO تا 45 روز دیگر.
//
// جلوگیری از downgrade:
//   اگر پلن فعال رتبهٔ بالاتری دارد، خرید پلن پایین‌تر مسدود است.
//   مثال: PRO فعال → نمی‌توان PLUS خرید (تا وقتی PRO منقضی نشده).
//
// مدت: ماهانه=۳۰ روز، سالانه=۳۶۵ روز. اعلان `plan.changed` (parity با ارتقای ادمین).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { applyDiscount, type BillingCycle } from "@/lib/plans/discount-shared";
import { isPlanKey } from "@/lib/plans/features";
import { genTxRef } from "@/lib/wallet/wallet";
import { createNotification } from "@/lib/notifications/server";

const DAY_MS = 24 * 60 * 60 * 1000;
const DURATION_DAYS: Record<BillingCycle, number> = { monthly: 30, annual: 365 };

// ترتیب رتبهٔ پلن‌ها (بالاتر = ارزش بیشتر)
const PLAN_RANK: Record<string, number> = { FREE: 0, PLUS: 1, PRO: 2 };

export type PurchaseResult =
  | {
      ok: true;
      txId: string;
      refCode: string;
      plan: string;
      cycle: BillingCycle;
      amount: number;
      balanceAfter: number;
      expiresAt: Date;
    }
  | { ok: false; error: string; needTopup?: boolean; shortBy?: number; isDowngrade?: boolean };

export async function purchasePlan(
  userId: string,
  planKey: string,
  cycle: BillingCycle,
  code?: string
): Promise<PurchaseResult> {
  if (!isPlanKey(planKey) || planKey === "FREE") {
    return { ok: false, error: "پلن نامعتبر است." };
  }
  if (cycle !== "monthly" && cycle !== "annual") {
    return { ok: false, error: "دورهٔ پرداخت نامعتبر است." };
  }

  const now = getNow();

  // قیمت از DB (server-side؛ هرگز از کلاینت)
  const plan = await prisma.plan.findUnique({
    where: { key: planKey },
    select: { key: true, label: true, isActive: true, monthlyPrice: true, annualPrice: true },
  });
  if (!plan || !plan.isActive) return { ok: false, error: "پلن یافت نشد." };
  const basePrice = cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
  if (basePrice <= 0) return { ok: false, error: "این پلن هنوز قیمت‌گذاری نشده است." };

  // تخفیف (اختیاری)
  let finalPrice = basePrice;
  let discountRowId: string | null = null;
  if (code && code.trim()) {
    const row = await prisma.discountCode.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!row) return { ok: false, error: "کد تخفیف نامعتبر است." };
    const res = applyDiscount(row, planKey, cycle, basePrice, now);
    if (!res.ok) return { ok: false, error: res.reason ?? "کد تخفیف معتبر نیست." };
    finalPrice = res.finalPrice ?? basePrice;
    discountRowId = row.id;
  }

  // موجودی + پلن فعلی
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true, plan: true, planExpiresAt: true, planPaidSince: true },
  });
  if (!user) return { ok: false, error: "کاربر یافت نشد." };

  // ── جلوگیری از downgrade ─────────────────────────────────────────────────
  const currentRank = PLAN_RANK[user.plan] ?? 0;
  const targetRank = PLAN_RANK[planKey] ?? 0;
  const hasActivePlan = user.plan !== "FREE" && user.planExpiresAt != null && user.planExpiresAt > now;
  if (hasActivePlan && targetRank < currentRank) {
    return {
      ok: false,
      isDowngrade: true,
      error: `پلن ${plan.label} پایین‌تر از پلن فعلی شماست. تا پایان دورهٔ جاری می‌توانی از پلن فعلی استفاده کنی؛ پس از انقضا می‌توانی پلن دیگری انتخاب کنی.`,
    };
  }

  if (user.walletBalance < finalPrice) {
    return { ok: false, error: "موجودی کیف‌پول کافی نیست.", needTopup: true, shortBy: finalPrice - user.walletBalance };
  }

  // ── تمدید هوشمند با انتقال زمان ─────────────────────────────────────────
  const durationMs = DURATION_DAYS[cycle] * DAY_MS;
  // اگر پلن فعالی (از هر نوع) وجود دارد، مدت جدید از انتهای آن شروع می‌شود (نه از حالا)
  const expiresAt = hasActivePlan
    ? new Date(user.planExpiresAt!.getTime() + durationMs) // انتقال زمان (ارتقا یا تمدید)
    : new Date(now.getTime() + durationMs); // منقضی / FREE → از حالا
  const planPaidSince = user.planPaidSince ?? now; // اولین‌بار = حالا؛ تمدید = حفظ

  const ref = await genTxRef("HP");

  try {
    const result = await prisma.$transaction(async (db) => {
      // قفلِ منطقی با re-read موجودی داخل تراکنش
      const fresh = await db.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
      if (!fresh || fresh.walletBalance < finalPrice) {
        return { ok: false as const, error: "موجودی کیف‌پول کافی نیست.", needTopup: true };
      }
      const balanceAfter = fresh.walletBalance - finalPrice;
      await db.user.update({
        where: { id: userId },
        data: { walletBalance: balanceAfter, plan: planKey, planExpiresAt: expiresAt, planPaidSince },
      });
      const tx = await db.walletTransaction.create({
        data: {
          userId,
          type: "purchase",
          amount: -finalPrice,
          balanceAfter,
          status: "completed",
          refCode: ref,
          planKey,
          cycle,
        },
      });
      if (discountRowId) {
        await db.discountCode.update({ where: { id: discountRowId }, data: { usedCount: { increment: 1 } } });
      }
      return { ok: true as const, txId: tx.id, balanceAfter };
    });

    if (!result.ok) return { ok: false, error: result.error, needTopup: result.needTopup };

    await createNotification({
      userId,
      type: "plan.changed",
      data: { plan: planKey, planLabel: plan.label },
    });

    return {
      ok: true,
      txId: result.txId,
      refCode: ref,
      plan: planKey,
      cycle,
      amount: finalPrice,
      balanceAfter: result.balanceAfter,
      expiresAt,
    };
  } catch (err) {
    console.error("[purchase] ناموفق:", err);
    return { ok: false, error: "خطای سرور در خرید." };
  }
}
