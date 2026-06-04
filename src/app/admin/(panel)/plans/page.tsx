// ─────────────────────────────────────────────────────────────────────────────
// /admin/plans — مدیریت پلن‌ها (DECISION-040)
//   - ویرایش قیمت/برچسب/توضیح/ترتیب/highlight هر پلن
//   - ماتریس امکانات (روشن/خاموش + quota) از کاتالوگ کد
//   - bulletهای متنی آزاد (موارد «به‌زودی»)
//   - مدیریت کدهای تخفیف
// enforce: plans.read؛ تغییر: plans.write
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import {
  PLAN_FEATURES,
  PLAN_KEYS,
  defaultBool,
  defaultQuota,
  type PlanKey,
} from "@/lib/plans/features";
import { serializeDiscount } from "@/lib/plans/discount-shared";
import { PlansManager, type PlanView } from "@/components/admin/plans/PlansManager";
import { DiscountManager } from "@/components/admin/plans/DiscountManager";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const ctx = await requirePermission("plans.read");
  const canWrite = can(ctx, "plans.write");

  const [planRows, discountRows] = await Promise.all([
    prisma.plan.findMany({
      orderBy: { order: "asc" },
      include: { features: true, bullets: { orderBy: { order: "asc" } } },
    }),
    prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const byKey = new Map(planRows.map((p) => [p.key, p]));

  // ساخت View هر پلن با مقادیر مؤثر امکانات (DB → fallback پیش‌فرض کاتالوگ)
  const plans: PlanView[] = PLAN_KEYS.map((key) => {
    const row = byKey.get(key);
    const featureRows = new Map((row?.features ?? []).map((f) => [f.featureKey, f]));
    const features: PlanView["features"] = {};
    for (const def of PLAN_FEATURES) {
      const r = featureRows.get(def.key);
      features[def.key] = {
        visible: r ? r.visible : true,
        comingSoon: r ? r.comingSoon : Boolean(def.comingSoon),
        disabled: r ? r.disabled : def.type === "boolean" ? !defaultBool(def.key, key as PlanKey) : false,
        value: def.type === "quota" ? (r && r.value !== null ? r.value : defaultQuota(def.key, key as PlanKey)) : null,
        label: r?.label ?? null,
      };
    }
    return {
      key,
      label: row?.label ?? key,
      description: row?.description ?? "",
      order: row?.order ?? 0,
      monthlyPrice: row?.monthlyPrice ?? 0,
      annualPrice: row?.annualPrice ?? 0,
      highlight: row?.highlight ?? false,
      isActive: row?.isActive ?? true,
      bullets: (row?.bullets ?? []).map((b) => ({
        text: b.text, visible: b.visible, comingSoon: b.comingSoon, disabled: b.disabled,
      })),
      features,
    };
  });

  const catalog = PLAN_FEATURES.map((f) => ({
    key: f.key,
    label: f.label,
    description: f.description ?? "",
    group: f.group,
    type: f.type,
    unit: f.unit ?? "",
    comingSoon: Boolean(f.comingSoon),
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-ink">مدیریت پلن‌ها</h1>
        <p className="text-sm text-stone mt-1 leading-relaxed max-w-xl">
          قیمت‌ها، امکانات و کدهای تخفیف هر پلن — همه از همین‌جا. هر امکانی که اینجا روشن کنی، در اپ هم برای کاربرانِ آن پلن فعال می‌شود.
        </p>
      </header>

      <div className="rounded-xl bg-mist/15 border border-mist/30 px-4 py-3 text-[12px] leading-relaxed text-charcoal">
        <div className="font-semibold text-ink mb-1">این بخش چه می‌کند؟</div>
        <ul className="list-disc pr-4 space-y-1">
          <li><b>قیمت‌ها</b> به تومان‌اند: «ماهانه» و «سالانهٔ یکجا». صفحه خودش «معادل ماهانه» را برای پرداخت سالانه حساب می‌کند.</li>
          <li><b>امکانات</b> دو نوع‌اند: روشن/خاموش (مثل تب تأمل) و عددی (مثل سقف پیام چت). موارد «به‌زودی» هنوز در اپ فعال نیستند ولی در جدول مقایسه دیده می‌شوند.</li>
          <li><b>خط‌های متنی</b> برای نوشتن مزیت‌هایی که هنوز کدش آماده نیست (صرفاً نمایشی روی کارت پلن).</li>
          <li><b>کد تخفیف</b>: چون درگاه پرداخت هنوز نیست، کاربر در صفحهٔ پلن‌ها کد را می‌زند و قیمت با تخفیف را می‌بیند؛ خرید واقعی بعداً وصل می‌شود.</li>
        </ul>
      </div>

      <PlansManager plans={plans} catalog={catalog} canWrite={canWrite} />

      <DiscountManager
        discounts={discountRows.map(serializeDiscount)}
        planKeys={[...PLAN_KEYS]}
        canWrite={canWrite}
      />
    </div>
  );
}
