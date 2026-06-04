// ─────────────────────────────────────────────────────────────────────────────
// POST /api/account/phone/request-code — افزودنِ موبایل به کاربرِ واردشده (DECISION-059)
//
// body: { phone }
// - کاربر باید لاگین باشد (session)
// - موبایل نباید متعلق به کاربرِ دیگری باشد
// - OTP از طریقِ SMSAdapter ارسال می‌شود؛ در dev با devOnlyPayload به UI برمی‌گردد
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getSMSAdapter } from "@/lib/adapters";
import { generateOtpCode, normalizeIranPhone, getOtpExpiry } from "@/lib/utils/otp";
import { devOnlyPayload } from "@/lib/utils/dev-response";
import { getNow } from "@/lib/dev/time";

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = (await req.json().catch(() => null)) as { phone?: unknown } | null;
    const phone = typeof body?.phone === "string" ? normalizeIranPhone(body.phone) : null;
    if (!phone) {
      return NextResponse.json({ error: "شماره موبایل معتبر نیست." }, { status: 400 });
    }

    // موبایل متعلق به کاربرِ دیگری است؟
    const owner = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (owner && owner.id !== session.userId) {
      return NextResponse.json({ error: "این شماره قبلاً ثبت شده است." }, { status: 409 });
    }

    const now = getNow();
    const active = await prisma.otpCode.findFirst({
      where: { phone, isUsed: false, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });
    if (active) {
      return NextResponse.json({ ok: true, ...devOnlyPayload({ devCode: active.code }) });
    }

    const code = generateOtpCode();
    await prisma.otpCode.create({ data: { phone, code, expiresAt: getOtpExpiry() } });

    const sms = getSMSAdapter();
    await sms.sendOTP(phone, code);

    return NextResponse.json({ ok: true, ...devOnlyPayload({ devCode: code }) });
  } catch (err) {
    console.error("[account/phone/request-code]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
