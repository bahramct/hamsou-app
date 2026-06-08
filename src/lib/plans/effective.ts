// ─────────────────────────────────────────────────────────────────────────────
// plans/effective.ts — پلنِ مؤثرِ کاربر با انقضا (DECISION-062) ⭐ هستهٔ هم‌ترازی
//
// تنها مرجعِ «پلنِ فعلیِ کاربر» برای گیت‌ها. اگر پلن مدت‌دار منقضی شده باشد،
// lazy-downgrade به FREE می‌کند (DB به‌روز می‌ماند → خواندن‌های موجودِ user.plan هم درست) + اعلان.
// چک ۳ روز مانده: اگر پلن ≤ ۳ روز تا انقضا دارد و نوتیفیکیشن expiring_soon در ۲۴ ساعت اخیر
// ارسال نشده باشد، یک اعلان هشدار ارسال می‌شود (یک‌بار در روز).
// زمان: getNow() (time-travel در dev کار می‌کند).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { createNotification } from "@/lib/notifications/server";

export interface EffectivePlanInfo {
  plan: string;
  planExpiresAt: Date | null;
  planPaidSince: Date | null;
  daysLeft: number | null; // روزهای باقی‌مانده؛ null = بدون انقضا
}

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRY_WARN_DAYS = 3;

/** پلنِ مؤثرِ کاربر؛ اگر منقضی شده باشد یک‌بار به FREE برمی‌گرداند + اعلان `plan.expired`.
 *  اگر ≤ ۳ روز به انقضا مانده باشد و در ۲۴ ساعت اخیر اعلان ارسال نشده، `plan.expiring_soon` می‌فرستد. */
export async function getEffectivePlan(userId: string): Promise<EffectivePlanInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true, planPaidSince: true },
  });
  if (!user) return { plan: "FREE", planExpiresAt: null, planPaidSince: null, daysLeft: null };

  const now = getNow();

  // ── انقضا شده → lazy downgrade ──────────────────────────────────────────
  if (user.plan !== "FREE" && user.planExpiresAt && user.planExpiresAt <= now) {
    await prisma.user.update({
      where: { id: userId },
      data: { plan: "FREE", planExpiresAt: null, planPaidSince: null },
    });
    await createNotification({ userId, type: "plan.expired", data: { previousPlan: user.plan } });
    return { plan: "FREE", planExpiresAt: null, planPaidSince: null, daysLeft: null };
  }

  // ── محاسبه روزهای باقی‌مانده ───────────────────────────────────────────
  let daysLeft: number | null = null;
  if (user.plan !== "FREE" && user.planExpiresAt) {
    const msLeft = user.planExpiresAt.getTime() - now.getTime();
    daysLeft = Math.max(0, Math.ceil(msLeft / DAY_MS));

    // ── هشدار ۳ روز مانده (یک‌بار در ۲۴ ساعت) ───────────────────────────
    if (daysLeft <= EXPIRY_WARN_DAYS) {
      const since = new Date(now.getTime() - DAY_MS);
      const recentWarn = await prisma.notification.findFirst({
        where: { userId, type: "plan.expiring_soon", createdAt: { gte: since } },
        select: { id: true },
      });
      if (!recentWarn) {
        const plan = await prisma.plan.findUnique({
          where: { key: user.plan },
          select: { label: true },
        });
        await createNotification({
          userId,
          type: "plan.expiring_soon",
          data: { plan: user.plan, planLabel: plan?.label ?? user.plan, daysLeft },
        });
      }
    }
  }

  return {
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
    planPaidSince: user.planPaidSince,
    daysLeft,
  };
}

/** فقط کلیدِ پلنِ مؤثر (برای گیت‌هایی که تنها رشتهٔ plan می‌خواهند). */
export async function getEffectivePlanKey(userId: string): Promise<string> {
  return (await getEffectivePlan(userId)).plan;
}
