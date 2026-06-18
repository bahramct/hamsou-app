// PATCH /api/admin/users/[id]/plan-adjust-days — افزودن/کاستنِ روز از انقضای پلن
// Body: { days: number }  (مثبت = افزودن، منفی = کاستن)
// اگر planExpiresAt null باشد (اعطای دائمی):
//   days > 0 → now + days تنظیم می‌شود
//   days < 0 → خطا (از تاریخِ نامعین نمی‌توان کاست)
// اگر planExpiresAt مقدار داشته باشد: days روز به آن اضافه (یا کم) می‌شود
// حداقل تاریخِ حاصل = امروز (نمی‌توان انقضا را به گذشته برد)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { getNow } from "@/lib/dev/time";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "users.plan.write")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const days: unknown = body?.days;

  if (typeof days !== "number" || !Number.isInteger(days) || days === 0) {
    return NextResponse.json({ error: "مقدارِ روز باید عددِ صحیحِ غیرصفر باشد." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, plan: true, planExpiresAt: true },
  });
  if (!user) return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });

  if (user.plan === "FREE") {
    return NextResponse.json({ error: "کاربر پلنِ رایگان دارد — تنظیمِ روز معنایی ندارد." }, { status: 409 });
  }

  const now = getNow();
  let newExpiry: Date;

  if (user.planExpiresAt === null) {
    // پلنِ دائمی
    if (days < 0) {
      return NextResponse.json(
        { error: "پلنِ این کاربر تاریخِ انقضا ندارد — نمی‌توان روز کم کرد." },
        { status: 409 }
      );
    }
    newExpiry = new Date(now.getTime() + days * MS_PER_DAY);
  } else {
    newExpiry = new Date(user.planExpiresAt.getTime() + days * MS_PER_DAY);
    // جلوگیری از برگرداندن انقضا به گذشته
    if (newExpiry < now) {
      return NextResponse.json(
        { error: "تاریخِ انقضا نمی‌تواند به گذشته برگردد." },
        { status: 409 }
      );
    }
  }

  await prisma.user.update({ where: { id }, data: { planExpiresAt: newExpiry } });
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "user.plan.adjust-days",
    targetType: "user",
    targetId: id,
    meta: { days, prevExpiry: user.planExpiresAt?.toISOString() ?? null, newExpiry: newExpiry.toISOString() },
  });

  return NextResponse.json({ ok: true, newExpiry: newExpiry.toISOString() });
}
