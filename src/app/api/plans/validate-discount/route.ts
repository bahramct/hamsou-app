// ─────────────────────────────────────────────────────────────────────────────
// /api/plans/validate-discount — اعتبارسنجی عمومی کد تخفیف (DECISION-040)
//   POST { code, cycle } → برای هر پلن فعال، قیمت با تخفیف را برمی‌گرداند.
// عمومی (بدون ورود) — فقط نمایش قیمت؛ مصرف واقعی موکول به درگاه پرداخت.
// کد اختصاصی (targetUserId≠null): فقط کاربر هدف، پیام «کد نامعتبر» برای بقیه (DECISION-109).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { applyDiscount, type BillingCycle } from "@/lib/plans/discount-shared";
import { getSessionUser } from "@/lib/utils/auth-server";

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const rawCode = typeof b?.code === "string" ? b.code.trim().toUpperCase() : "";
  const cycle: BillingCycle = b?.cycle === "annual" ? "annual" : "monthly";

  if (!rawCode) return NextResponse.json({ ok: false, reason: "کد را وارد کن." }, { status: 200 });

  const row = await prisma.discountCode.findUnique({ where: { code: rawCode } });
  if (!row) return NextResponse.json({ ok: false, reason: "کد نامعتبر است." }, { status: 200 });

  // کد اختصاصی — فقط کاربر هدف می‌تواند از آن استفاده کند (DECISION-109)
  if (row.targetUserId) {
    const session = await getSessionUser();
    if (!session || session.userId !== row.targetUserId) {
      return NextResponse.json({ ok: false, reason: "کد نامعتبر است." }, { status: 200 });
    }
  }

  const now = getNow();
  // بررسی‌های سراسری (پیام واحد)
  if (!row.isActive) return NextResponse.json({ ok: false, reason: "این کد فعال نیست." });
  if (row.startsAt && now < row.startsAt) return NextResponse.json({ ok: false, reason: "این کد هنوز فعال نشده است." });
  if (row.expiresAt && now > row.expiresAt) return NextResponse.json({ ok: false, reason: "این کد منقضی شده است." });
  if (row.maxUses !== null && row.usedCount >= row.maxUses)
    return NextResponse.json({ ok: false, reason: "ظرفیت این کد تمام شده است." });

  const plans = await prisma.plan.findMany({ where: { isActive: true }, select: { key: true, monthlyPrice: true, annualPrice: true } });
  const results: Record<string, { ok: boolean; discount?: number; finalPrice?: number; reason?: string }> = {};
  for (const p of plans) {
    const price = cycle === "annual" ? p.annualPrice : p.monthlyPrice;
    const r = applyDiscount(row, p.key, cycle, price, now);
    results[p.key] = r.ok
      ? { ok: true, discount: r.discount, finalPrice: r.finalPrice }
      : { ok: false, reason: r.reason };
  }

  return NextResponse.json({ ok: true, code: row.code, cycle, results });
}
