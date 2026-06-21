// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/users/[id]/discounts — صدور کد تخفیف اختصاصی برای کاربر (DECISION-109)
// enforce: plans.write
// body: { code, kind, value, maxUses?, daysValid?, reason } — reason اجباری
// maxUses: پیش‌فرض ۱؛ ادمین می‌تواند عدد بزرگ‌تر بدهد.
// → DiscountCode با targetUserId=user.id + نوتیف discount.personal
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { parseDiscountBody, arrToCsv } from "@/lib/plans/discount-shared";
import { createNotification } from "@/lib/notifications/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAdminSession();
    if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
    if (!can(ctx, "plans.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, displayName: true, isBanned: true },
    });
    if (!user) return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = parseDiscountBody(body, { requireCode: true });
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const d = parsed.data;

    const b = body as Record<string, unknown> | null;
    const reason = typeof b?.reason === "string" ? b.reason.trim() : "";
    if (!reason) return NextResponse.json({ error: "دلیل صدور کد تخفیف اجباری است." }, { status: 400 });
    if (reason.length > 300) return NextResponse.json({ error: "دلیل حداکثر ۳۰۰ نویسه." }, { status: 400 });

    // maxUses — پیش‌فرض ۱ (تک‌بار)؛ ادمین می‌تواند بیشتر بدهد
    const rawMaxUses = b?.maxUses;
    const maxUses =
      typeof rawMaxUses === "number" && Number.isInteger(rawMaxUses) && rawMaxUses >= 1
        ? rawMaxUses
        : 1;

    // مدت اعتبار از daysValid (اختیاری)
    const daysValid = typeof b?.daysValid === "number" && b.daysValid > 0 ? Math.floor(b.daysValid) : null;
    const now = getNow();
    const expiresAt = daysValid
      ? new Date(now.getTime() + daysValid * 24 * 60 * 60 * 1000)
      : (d.expiresAt ?? null);

    const exists = await prisma.discountCode.findUnique({ where: { code: d.code! } });
    if (exists) return NextResponse.json({ error: "این کد قبلاً ثبت شده است." }, { status: 400 });

    const created = await prisma.discountCode.create({
      data: {
        code: d.code!,
        kind: d.kind!,
        value: d.value!,
        plans: d.plans ?? arrToCsv([]),
        cycles: d.cycles ?? arrToCsv([]),
        maxUses,
        startsAt: d.startsAt ?? null,
        expiresAt,
        isActive: true,
        note: d.note ?? null,
        targetUserId: user.id,
        reason,
        createdById: ctx.admin.id,
      },
    });

    // نوتیف discount.personal
    await createNotification({
      userId: user.id,
      type: "discount.personal",
      data: {
        code: created.code,
        kind: created.kind,
        value: created.value,
        reason,
        displayName: user.displayName ?? undefined,
        daysLeft: daysValid ?? undefined,
        maxUses,
      },
    });

    await logAdminAction({
      actorId: ctx.admin.id,
      action: "discount.personal.create",
      targetType: "user",
      targetId: user.id,
      meta: { code: created.code, kind: created.kind, value: created.value, reason, maxUses },
    });

    return NextResponse.json({ ok: true, id: created.id, code: created.code });
  } catch (err) {
    console.error("[discounts] خطای غیرمنتظره:", err);
    const msg = err instanceof Error ? err.message : "خطای سرور";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
