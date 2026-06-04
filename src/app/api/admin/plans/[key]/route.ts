// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/plans/[key] — ویرایش یک پلن (DECISION-040)
//   PATCH: فیلدهای پلن (قیمت/برچسب/توضیح/ترتیب/highlight/isActive)
//          + ماتریس امکانات (features) + bulletهای متنی — همه در یک ذخیره.
// enforce: plans.write
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { invalidatePlanCache } from "@/lib/plans/access";
import { getPlanFeatureDef, isPlanKey } from "@/lib/plans/features";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "plans.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { key } = await params;
  if (!isPlanKey(key)) return NextResponse.json({ error: "پلن نامعتبر." }, { status: 400 });

  const existing = await prisma.plan.findUnique({ where: { key } });
  if (!existing) return NextResponse.json({ error: "پلن یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });

  // ── فیلدهای scalar پلن ──────────────────────────────────────────────────
  const data: Record<string, unknown> = {};
  if (typeof b.label === "string") {
    if (!b.label.trim()) return NextResponse.json({ error: "برچسب خالی است." }, { status: 400 });
    data.label = b.label.trim();
  }
  if (typeof b.description === "string") data.description = b.description.trim() || null;
  if (b.order !== undefined) {
    const n = Number(b.order);
    if (!Number.isInteger(n)) return NextResponse.json({ error: "ترتیب نامعتبر." }, { status: 400 });
    data.order = n;
  }
  if (typeof b.highlight === "boolean") data.highlight = b.highlight;
  if (typeof b.isActive === "boolean") data.isActive = b.isActive;
  for (const priceField of ["monthlyPrice", "annualPrice"] as const) {
    if (b[priceField] !== undefined) {
      const n = Number(b[priceField]);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "قیمت باید عدد نامنفی باشد." }, { status: 400 });
      data[priceField] = Math.round(n);
    }
  }

  // ── اعتبارسنجی امکانات (فلگ‌محور — DECISION-042) ─────────────────────────
  const featureUpdates: {
    featureKey: string; visible: boolean; comingSoon: boolean; disabled: boolean; value: number | null; label: string | null;
  }[] = [];
  if (Array.isArray(b.features)) {
    for (const f of b.features as unknown[]) {
      const fo = f as Record<string, unknown>;
      const featureKey = typeof fo.featureKey === "string" ? fo.featureKey : "";
      const def = getPlanFeatureDef(featureKey);
      if (!def) return NextResponse.json({ error: `امکان نامعتبر: ${featureKey}` }, { status: 400 });

      let value: number | null = null;
      if (def.type === "quota") {
        const n = Number(fo.value);
        if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: `مقدار «${def.label}» باید عدد نامنفی باشد.` }, { status: 400 });
        value = Math.round(n);
      }
      const label = typeof fo.label === "string" && fo.label.trim() ? fo.label.trim() : null;
      featureUpdates.push({
        featureKey,
        visible: fo.visible !== false, // پیش‌فرض نمایش
        comingSoon: fo.comingSoon === true,
        disabled: fo.disabled === true,
        value,
        label,
      });
    }
  }

  // ── قابلیت‌های سفارشی (bulletها) — هرکدام با فلگ‌های نمایشی (DECISION-042) ──
  let bullets: { text: string; order: number; visible: boolean; comingSoon: boolean; disabled: boolean }[] | null = null;
  if (Array.isArray(b.bullets)) {
    bullets = (b.bullets as unknown[])
      .map((x, i) => {
        const o = x as Record<string, unknown>;
        const text = typeof o.text === "string" ? o.text.trim() : "";
        return {
          text,
          order: i,
          visible: o.visible !== false, // پیش‌فرض نمایش
          comingSoon: o.comingSoon === true,
          disabled: o.disabled === true,
        };
      })
      .filter((x) => x.text);
  }

  // ── اعمال در یک تراکنش ──────────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.plan.update({ where: { key }, data });
    }
    for (const fu of featureUpdates) {
      const fields = {
        visible: fu.visible, comingSoon: fu.comingSoon, disabled: fu.disabled, value: fu.value, label: fu.label,
      };
      await tx.planFeatureValue.upsert({
        where: { planKey_featureKey: { planKey: key, featureKey: fu.featureKey } },
        update: fields,
        create: { planKey: key, featureKey: fu.featureKey, ...fields },
      });
    }
    if (bullets !== null) {
      await tx.planBullet.deleteMany({ where: { planKey: key } });
      if (bullets.length > 0) {
        await tx.planBullet.createMany({
          data: bullets.map((bl) => ({
            planKey: key, text: bl.text, order: bl.order,
            visible: bl.visible, comingSoon: bl.comingSoon, disabled: bl.disabled,
          })),
        });
      }
    }
  });

  invalidatePlanCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "plan.update",
    targetType: "plan",
    targetId: key,
    meta: { fields: Object.keys(data), features: featureUpdates.length, bullets: bullets?.length ?? "—" },
  });

  return NextResponse.json({ ok: true });
}
