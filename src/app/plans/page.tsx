// ─────────────────────────────────────────────────────────────────────────────
// /plans — مقایسهٔ پلن‌ها (DECISION-040) — کاملاً پویا از DB
//
// قیمت‌ها/امکانات/bulletها از «مدیریت پلن‌ها» می‌آیند. کاربر لاگین → پلن فعلی highlight.
// Public: بدون نیاز به ورود. سوییچ ماهانه/سالانه و کد تخفیف در PlansPricing (client).
// ─────────────────────────────────────────────────────────────────────────────

import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import {
  PLAN_FEATURES,
  defaultBool,
  defaultQuota,
  type PlanKey,
} from "@/lib/plans/features";
import { PlansPricing, type PublicPlan, type PublicFeature } from "@/components/features/plans/PlansPricing";
import { PlanReturnToast } from "@/components/features/plans/PlanReturnToast";
import { getEffectivePlan } from "@/lib/plans/effective";

export const dynamic = "force-dynamic";

// ویژگی‌های پایه (مشترک همهٔ پلن‌ها — محصول، نه قابل‌گیت)
const BASE_FEATURES = [
  "تعهد روزانه",
  "بازخورد روزانه",
  "تاریخچهٔ کامل",
  "گزارش هفتگی (خلاصه + نکات)",
];

interface FeatureRowDb {
  visible: boolean; comingSoon: boolean; disabled: boolean; value: number | null; label: string | null;
}

// یک امکان کاتالوگ → ردیف نمایشی پلن (با فلگ‌های visible/comingSoon/disabled + label override).
// خروجی null اگر امکان روی این پلن مخفی شده باشد (DECISION-042).
function catalogFeatureRow(featureKey: string, plan: PlanKey, r: FeatureRowDb | undefined): PublicFeature | null {
  const def = PLAN_FEATURES.find((f) => f.key === featureKey);
  if (!def) return null;
  const visible = r ? r.visible : true;
  if (!visible) return null;
  const comingSoon = r ? r.comingSoon : Boolean(def.comingSoon);
  const disabled = r ? r.disabled : def.type === "boolean" ? !defaultBool(featureKey, plan) : false;
  const text = r?.label ?? def.label;
  const quota =
    def.type === "quota"
      ? `${(r && r.value !== null ? r.value : defaultQuota(featureKey, plan)).toLocaleString("fa-IR")} ${def.unit}`.trim()
      : null;
  return { text, quota, comingSoon, disabled };
}

export default async function PlansPage() {
  const user = await getSessionUser();

  let currentPlan = "FREE";
  let walletBalance = 0;
  let planDaysLeft: number | null = null;
  let currentPlanBasePrice = 0;
  if (user) {
    // پلنِ مؤثر (با انقضا — DECISION-062) + موجودی کیف‌پول برای خرید
    const [eff, dbUser] = await Promise.all([
      getEffectivePlan(user.userId),
      prisma.user.findUnique({ where: { id: user.userId }, select: { walletBalance: true } }),
    ]);
    currentPlan = eff.plan;
    planDaysLeft = eff.daysLeft;
    walletBalance = dbUser?.walletBalance ?? 0;

    // قیمت پلن فعال کاربر برای مقایسه در UI (DECISION-076)
    if (currentPlan !== "FREE" && planDaysLeft != null && planDaysLeft > 0) {
      const [currentPlanRow, lastPurchaseTx] = await Promise.all([
        prisma.plan.findUnique({ where: { key: currentPlan }, select: { monthlyPrice: true, annualPrice: true } }),
        prisma.walletTransaction.findFirst({
          where: { userId: user.userId, type: "purchase", planKey: currentPlan, status: "completed" },
          orderBy: { createdAt: "desc" },
        }),
      ]);
      if (currentPlanRow) {
        const activeCycle = lastPurchaseTx?.cycle === "annual" ? "annual" : "monthly";
        currentPlanBasePrice = activeCycle === "annual" ? currentPlanRow.annualPrice : currentPlanRow.monthlyPrice;
      }
    }
  }

  const rows = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: { features: true, bullets: { orderBy: { order: "asc" } } },
  });

  const plans: PublicPlan[] = rows.map((row) => {
    const key = row.key as PlanKey;
    const featureMap = new Map(
      row.features.map((f) => [
        f.featureKey,
        { visible: f.visible, comingSoon: f.comingSoon, disabled: f.disabled, value: f.value, label: f.label },
      ])
    );
    const catalogRows = PLAN_FEATURES
      .map((f) => catalogFeatureRow(f.key, key, featureMap.get(f.key)))
      .filter((x): x is PublicFeature => x !== null);

    // قابلیت‌های سفارشی (مدیریت‌شده از پنل) — فقط آن‌هایی که نمایش‌شان روشن است،
    // با همان منطق فلگ‌ها (به‌زودی خاکستری / غیرفعال خط‌خورده) — DECISION-042.
    const customRows: PublicFeature[] = row.bullets
      .filter((b) => b.visible)
      .map((b) => ({ text: b.text, quota: null, comingSoon: b.comingSoon, disabled: b.disabled }));

    return {
      key: row.key,
      label: row.label,
      description: row.description ?? "",
      highlight: row.highlight,
      isCurrent: Boolean(user) && currentPlan === row.key,
      monthlyPrice: row.monthlyPrice,
      annualPrice: row.annualPrice,
      features: [
        ...BASE_FEATURES.map((t) => ({ text: t, quota: null, comingSoon: false, disabled: false })),
        ...catalogRows,
        ...customRows,
      ],
    };
  });

  return (
    <AppShell>
      <PlanReturnToast />
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 sm:py-14 animate-fade-up">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-xl font-semibold text-ink">پلن‌ها</h1>
          <p className="text-sm text-fog max-w-xs mx-auto leading-relaxed">
            هر پلن را با امکاناتش مقایسه کن — خرید با کیف‌پول یا پرداخت آنلاین مستقیم.
          </p>
        </div>

        <PlansPricing
          plans={plans}
          isLoggedIn={Boolean(user)}
          walletBalance={walletBalance}
          currentPlanKey={currentPlan}
          planDaysLeft={planDaysLeft}
          currentPlanBasePrice={currentPlanBasePrice}
        />
      </div>
    </AppShell>
  );
}
