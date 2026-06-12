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

// ─── استعلام قیمت/اعتبار خرید (مشترک بین کیف‌پول و درگاه — DECISION-073) ──────
// همان اعتبارسنجی‌های purchasePlan (پلن، قیمت، تخفیف، جلوگیری از downgrade) بدون چک موجودی.

export type PurchaseQuote =
  | {
      ok: true;
      planKey: string;
      planLabel: string;
      cycle: BillingCycle;
      basePrice: number;
      finalPrice: number;
      appliedCode: string | null;
    }
  | { ok: false; error: string; isDowngrade?: boolean };

export async function quotePlanPurchase(
  userId: string,
  planKey: string,
  cycle: BillingCycle,
  code?: string
): Promise<PurchaseQuote> {
  if (!isPlanKey(planKey) || planKey === "FREE") return { ok: false, error: "پلن نامعتبر است." };
  if (cycle !== "monthly" && cycle !== "annual") return { ok: false, error: "دورهٔ پرداخت نامعتبر است." };

  const now = getNow();

  const plan = await prisma.plan.findUnique({
    where: { key: planKey },
    select: { key: true, label: true, isActive: true, monthlyPrice: true, annualPrice: true },
  });
  if (!plan || !plan.isActive) return { ok: false, error: "پلن یافت نشد." };
  const basePrice = cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
  if (basePrice <= 0) return { ok: false, error: "این پلن هنوز قیمت‌گذاری نشده است." };

  let finalPrice = basePrice;
  let appliedCode: string | null = null;
  if (code && code.trim()) {
    const row = await prisma.discountCode.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!row) return { ok: false, error: "کد تخفیف نامعتبر است." };
    const res = applyDiscount(row, planKey, cycle, basePrice, now);
    if (!res.ok) return { ok: false, error: res.reason ?? "کد تخفیف معتبر نیست." };
    finalPrice = res.finalPrice ?? basePrice;
    appliedCode = row.code;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });
  if (!user) return { ok: false, error: "کاربر یافت نشد." };

  const currentRank = PLAN_RANK[user.plan] ?? 0;
  const targetRank = PLAN_RANK[planKey] ?? 0;
  const hasActivePlan = user.plan !== "FREE" && user.planExpiresAt != null && user.planExpiresAt > now;
  if (hasActivePlan && targetRank < currentRank) {
    return {
      ok: false,
      isDowngrade: true,
      error: `پلن ${plan.label} پایین‌تر از پلن فعلی شماست. تا پایان دورهٔ جاری می‌توانی از پلن فعلی استفاده کنی.`,
    };
  }

  return { ok: true, planKey, planLabel: plan.label, cycle, basePrice, finalPrice, appliedCode };
}

// نشانگرِ کد تخفیف روی تراکنشِ درگاه (WalletTransaction فیلد جدا ندارد؛ خوانا برای ادمین)
const DISCOUNT_NOTE_RE = /کد تخفیف:\s*([A-Z0-9_-]+)/;

export function discountNote(code: string | null): string | null {
  return code ? `کد تخفیف: ${code}` : null;
}

// ─── خرید مستقیم پلن از درگاه (DECISION-073) ──────────────────────────────────
// جریان: createGatewayPurchase (pending) → [کاربر در درگاه] →
// applyGatewayPlanPurchase (اتمیک/idempotent) یا failGatewayPlanPurchase.

/** ساخت تراکنشِ pending خرید پلن از درگاه — قبل از هدایت به درگاه. */
export async function createGatewayPurchase(input: {
  userId: string;
  amount: number; // تومان، مثبت
  gateway: string;
  planKey: string;
  cycle: BillingCycle;
  appliedCode: string | null;
}) {
  const ref = await genTxRef("HP");
  return prisma.walletTransaction.create({
    data: {
      userId: input.userId,
      type: "purchase",
      amount: -input.amount, // خرید = خروجی (علامت‌دار، مثل خرید با کیف‌پول)
      status: "pending",
      refCode: ref,
      gateway: input.gateway,
      planKey: input.planKey,
      cycle: input.cycle,
      adminNote: discountNote(input.appliedCode),
    },
  });
}

export type GatewayPurchaseResult =
  | {
      ok: true;
      alreadyDone?: boolean;
      userId: string;
      planKey: string;
      planLabel: string;
      amount: number;
      refCode: string;
      expiresAt: Date | null;
    }
  | { ok: false; error: string };

/** اعمال خرید پلن پس از verify موفقِ درگاه — اتمیک و idempotent (گارد status).
 *  پول وارد کیف‌پول نمی‌شود؛ مستقیم صرف پلن شده است (balanceAfter = موجودی فعلی). */
export async function applyGatewayPlanPurchase(input: {
  authority: string;
  refId: string;
  cardPan?: string | null;
}): Promise<GatewayPurchaseResult> {
  const now = getNow();
  try {
    const result = await prisma.$transaction(async (db) => {
      const tx = await db.walletTransaction.findUnique({ where: { authority: input.authority } });
      if (!tx || tx.type !== "purchase" || !tx.planKey) {
        return { ok: false as const, error: "تراکنش یافت نشد." };
      }
      if (tx.status === "completed") {
        return {
          ok: true as const,
          alreadyDone: true,
          userId: tx.userId,
          planKey: tx.planKey,
          planLabel: tx.planKey,
          amount: Math.abs(tx.amount),
          refCode: tx.refCode,
          expiresAt: null,
        };
      }
      if (tx.status !== "pending") return { ok: false as const, error: "این خرید قابل تأیید نیست." };

      const user = await db.user.findUnique({
        where: { id: tx.userId },
        select: { plan: true, planExpiresAt: true, planPaidSince: true, walletBalance: true },
      });
      if (!user) return { ok: false as const, error: "کاربر یافت نشد." };

      const plan = await db.plan.findUnique({
        where: { key: tx.planKey },
        select: { key: true, label: true },
      });
      const planLabel = plan?.label ?? tx.planKey;

      const cycle: BillingCycle = tx.cycle === "annual" ? "annual" : "monthly";
      const durationMs = DURATION_DAYS[cycle] * DAY_MS;
      const hasActivePlan =
        user.plan !== "FREE" && user.planExpiresAt != null && user.planExpiresAt > now;

      // edge نادر: بین درخواست و پرداخت، پلنِ بالاتری فعال شده → پول هدر نمی‌رود؛
      // مبلغ به کیف‌پول برمی‌گردد (با یادداشت روشن برای ادمین و رسید).
      const currentRank = PLAN_RANK[user.plan] ?? 0;
      const targetRank = PLAN_RANK[tx.planKey] ?? 0;
      if (hasActivePlan && targetRank < currentRank) {
        const balanceAfter = user.walletBalance + Math.abs(tx.amount);
        await db.user.update({ where: { id: tx.userId }, data: { walletBalance: balanceAfter } });
        await db.walletTransaction.update({
          where: { id: tx.id },
          data: {
            status: "completed",
            balanceAfter,
            gatewayRefId: input.refId,
            cardPan: input.cardPan ?? null,
            reviewedAt: now,
            adminNote: [tx.adminNote, "پلن فعلی بالاتر بود — مبلغ به کیف‌پول اضافه شد."]
              .filter(Boolean)
              .join(" · "),
          },
        });
        return {
          ok: true as const,
          userId: tx.userId,
          planKey: tx.planKey,
          planLabel,
          amount: Math.abs(tx.amount),
          refCode: tx.refCode,
          expiresAt: null,
        };
      }

      const expiresAt = hasActivePlan
        ? new Date(user.planExpiresAt!.getTime() + durationMs)
        : new Date(now.getTime() + durationMs);
      const planPaidSince = user.planPaidSince ?? now;

      await db.user.update({
        where: { id: tx.userId },
        data: { plan: tx.planKey, planExpiresAt: expiresAt, planPaidSince },
      });
      await db.walletTransaction.update({
        where: { id: tx.id },
        data: {
          status: "completed",
          balanceAfter: user.walletBalance, // موجودی دست‌نخورده — پرداخت مستقیم
          gatewayRefId: input.refId,
          cardPan: input.cardPan ?? null,
          reviewedAt: now,
        },
      });

      // مصرف کد تخفیف فقط پس از پرداخت موفق
      const codeMatch = tx.adminNote?.match(DISCOUNT_NOTE_RE);
      if (codeMatch) {
        await db.discountCode
          .update({ where: { code: codeMatch[1] }, data: { usedCount: { increment: 1 } } })
          .catch(() => {}); // کد حذف‌شده — خرید نباید بشکند
      }

      return {
        ok: true as const,
        userId: tx.userId,
        planKey: tx.planKey,
        planLabel,
        amount: Math.abs(tx.amount),
        refCode: tx.refCode,
        expiresAt,
      };
    });
    return result;
  } catch (err) {
    console.error("[purchase] applyGatewayPlanPurchase ناموفق:", err);
    return { ok: false, error: "خطای سرور در تأیید خرید." };
  }
}

/** علامت‌زدن خرید درگاهیِ پلن به‌عنوان ناموفق — idempotent. */
export async function failGatewayPlanPurchase(input: {
  authority: string;
  reason: string;
}): Promise<{ ok: boolean; userId?: string }> {
  const tx = await prisma.walletTransaction.findUnique({ where: { authority: input.authority } });
  if (!tx || tx.type !== "purchase") return { ok: false };
  if (tx.status !== "pending") return { ok: true, userId: tx.userId };
  await prisma.walletTransaction.update({
    where: { id: tx.id },
    data: {
      status: "rejected",
      adminNote: [tx.adminNote, input.reason].filter(Boolean).join(" · ") || null,
      reviewedAt: getNow(),
    },
  });
  return { ok: true, userId: tx.userId };
}

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
