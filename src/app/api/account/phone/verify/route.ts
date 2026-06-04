// ─────────────────────────────────────────────────────────────────────────────
// POST /api/account/phone/verify — تأییدِ موبایلِ افزوده‌شده به کاربرِ واردشده (DECISION-059)
//
// body: { phone, code }
// - OTPِ معتبر را مصرف و موبایل را روی User ذخیره می‌کند
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { normalizeIranPhone } from "@/lib/utils/otp";
import { getNow } from "@/lib/dev/time";

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = (await req.json().catch(() => null)) as
      | { phone?: unknown; code?: unknown }
      | null;
    const phone = typeof body?.phone === "string" ? normalizeIranPhone(body.phone) : null;
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!phone || !code) {
      return NextResponse.json({ error: "شماره و کد الزامی‌اند." }, { status: 400 });
    }

    const record = await prisma.otpCode.findFirst({
      where: { phone, code, isUsed: false, expiresAt: { gt: getNow() } },
      orderBy: { createdAt: "desc" },
    });
    if (!record) {
      return NextResponse.json({ error: "کد تأیید نادرست یا منقضی شده است." }, { status: 401 });
    }

    // ممکن است در این فاصله موبایل توسط کاربرِ دیگری گرفته شده باشد
    const owner = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (owner && owner.id !== session.userId) {
      await prisma.otpCode.update({ where: { id: record.id }, data: { isUsed: true } });
      return NextResponse.json({ error: "این شماره قبلاً ثبت شده است." }, { status: 409 });
    }

    await prisma.otpCode.update({ where: { id: record.id }, data: { isUsed: true } });
    await prisma.user.update({ where: { id: session.userId }, data: { phone } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account/phone/verify]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
