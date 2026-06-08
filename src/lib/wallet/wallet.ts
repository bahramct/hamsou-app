// ─────────────────────────────────────────────────────────────────────────────
// wallet/wallet.ts — هستهٔ کیف‌پول (DECISION-062)
//
// درستیِ مالی: هر تغییرِ موجودی فقط داخل prisma.$transaction با ثبتِ balanceAfter.
// مبلغ به تومان و صحیح. تأیید idempotent (گارد status). زمان: getNow() (time-travel).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";

// ─── شناسهٔ یکتای شارژ: HM-hhmmdd-xxxx (تاریخِ جلالی + ۴ رقم تصادفی) ────────────

/** اجزای تاریخِ جلالی (لاتین) از یک Date. */
function jalaliYmd(d: Date): { yy: string; mm: string; dd: string } {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const year = get("year"); // مثل "1405"
  return { yy: year.slice(-2), mm: get("month"), dd: get("day") };
}

/** تولید refCode یکتا با فرمت HM-hhmmdd-xxxx (با retry تا یکتایی در DB). */
export async function genTopupRef(): Promise<string> {
  const { yy, mm, dd } = jalaliYmd(getNow());
  for (let i = 0; i < 12; i++) {
    const rand = Math.floor(1000 + Math.random() * 9000); // ۴ رقم
    const ref = `HM-${yy}${mm}${dd}-${rand}`;
    const exists = await prisma.walletTransaction.findUnique({ where: { refCode: ref }, select: { id: true } });
    if (!exists) return ref;
  }
  // fallback عملاً‌غیرممکن
  return `HM-${yy}${mm}${dd}-${Date.now().toString().slice(-4)}`;
}

/** کدِ مرجعِ تراکنشِ غیرِ شارژ (خرید/اصلاح) — برای رسید. */
export async function genTxRef(prefix: "HP" | "HA"): Promise<string> {
  const { yy, mm, dd } = jalaliYmd(getNow());
  for (let i = 0; i < 12; i++) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const ref = `${prefix}-${yy}${mm}${dd}-${rand}`;
    const exists = await prisma.walletTransaction.findUnique({ where: { refCode: ref }, select: { id: true } });
    if (!exists) return ref;
  }
  return `${prefix}-${yy}${mm}${dd}-${Date.now().toString().slice(-4)}`;
}

// ─── درخواست شارژ ─────────────────────────────────────────────────────────────

export async function createTopupRequest(input: {
  userId: string;
  amount: number;
  payerCardSnapshot: string | null;
  bankCardId: string | null;
}) {
  const ref = await genTopupRef();
  return prisma.walletTransaction.create({
    data: {
      userId: input.userId,
      type: "topup",
      amount: input.amount,
      status: "pending",
      refCode: ref,
      payerCardSnapshot: input.payerCardSnapshot,
      bankCardId: input.bankCardId,
    },
  });
}

// ─── تأیید/رد شارژ (اتمیک، idempotent) ────────────────────────────────────────

export type TopupActionResult =
  | { ok: true; userId: string; amount: number; balanceAfter: number; refCode: string }
  | { ok: false; error: string };

/** تأیید شارژ: موجودی را اتمیک اضافه می‌کند. amount اختیاری = اصلاحِ مبلغ توسط ادمین. */
export async function approveTopup(
  txId: string,
  adminId: string,
  amountOverride?: number
): Promise<TopupActionResult> {
  try {
    return await prisma.$transaction(async (db) => {
      const tx = await db.walletTransaction.findUnique({ where: { id: txId } });
      if (!tx || tx.type !== "topup") return { ok: false as const, error: "تراکنش یافت نشد." };
      if (tx.status !== "pending") return { ok: false as const, error: "این شارژ قبلاً بررسی شده است." };

      const amount = amountOverride != null && amountOverride > 0 ? Math.floor(amountOverride) : tx.amount;
      if (!amount || amount <= 0) return { ok: false as const, error: "مبلغ نامعتبر است." };

      const user = await db.user.findUnique({ where: { id: tx.userId }, select: { walletBalance: true } });
      if (!user) return { ok: false as const, error: "کاربر یافت نشد." };

      const balanceAfter = user.walletBalance + amount;
      await db.user.update({ where: { id: tx.userId }, data: { walletBalance: balanceAfter } });
      await db.walletTransaction.update({
        where: { id: txId },
        data: {
          status: "approved",
          amount,
          balanceAfter,
          reviewedByAdminId: adminId,
          reviewedAt: getNow(),
        },
      });
      return { ok: true as const, userId: tx.userId, amount, balanceAfter, refCode: tx.refCode };
    });
  } catch (err) {
    console.error("[wallet] approveTopup ناموفق:", err);
    return { ok: false, error: "خطای سرور در تأیید." };
  }
}

export async function rejectTopup(
  txId: string,
  adminId: string,
  reason: string
): Promise<{ ok: boolean; userId?: string; error?: string }> {
  const tx = await prisma.walletTransaction.findUnique({ where: { id: txId } });
  if (!tx || tx.type !== "topup") return { ok: false, error: "تراکنش یافت نشد." };
  if (tx.status !== "pending") return { ok: false, error: "این شارژ قبلاً بررسی شده است." };
  await prisma.walletTransaction.update({
    where: { id: txId },
    data: { status: "rejected", adminNote: reason || null, reviewedByAdminId: adminId, reviewedAt: getNow() },
  });
  return { ok: true, userId: tx.userId };
}

/** اصلاحِ دستیِ موجودی توسط ادمین (مثبت/منفی) — اتمیک. */
export async function adjustBalance(
  userId: string,
  delta: number,
  adminId: string,
  note: string
): Promise<TopupActionResult> {
  if (!Number.isInteger(delta) || delta === 0) return { ok: false, error: "مبلغ نامعتبر است." };
  const ref = await genTxRef("HA");
  try {
    return await prisma.$transaction(async (db) => {
      const user = await db.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
      if (!user) return { ok: false as const, error: "کاربر یافت نشد." };
      const balanceAfter = user.walletBalance + delta;
      if (balanceAfter < 0) return { ok: false as const, error: "موجودی منفی مجاز نیست." };
      await db.user.update({ where: { id: userId }, data: { walletBalance: balanceAfter } });
      await db.walletTransaction.create({
        data: {
          userId,
          type: "adjust",
          amount: delta,
          balanceAfter,
          status: "completed",
          refCode: ref,
          adminNote: note || null,
          reviewedByAdminId: adminId,
          reviewedAt: getNow(),
        },
      });
      return { ok: true as const, userId, amount: delta, balanceAfter, refCode: ref };
    });
  } catch (err) {
    console.error("[wallet] adjustBalance ناموفق:", err);
    return { ok: false, error: "خطای سرور." };
  }
}
