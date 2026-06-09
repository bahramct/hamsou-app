// ─────────────────────────────────────────────────────────────────────────────
// POST /api/account/email/request-code — افزودنِ ایمیل به کاربرِ واردشده (DECISION-058)
//
// body: { email }
// - کاربر باید لاگین باشد (session)
// - ایمیل نباید متعلق به کاربرِ دیگری باشد
// - کدِ تأیید با purpose="add-email" و userI به EmailCode ذخیره و ارسال می‌شود
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { sendVerificationCodeEmail } from "@/lib/email/send";
import { normalizeEmail, generateEmailCode, getEmailCodeExpiry } from "@/lib/auth/credentials";
import { devOnlyPayload } from "@/lib/utils/dev-response";
import { getNow } from "@/lib/dev/time";

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
    const email = normalizeEmail(body?.email);
    if (!email) {
      return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
    }

    // ایمیل متعلق به کاربرِ دیگری است؟
    const owner = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (owner && owner.id !== session.userId) {
      return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده است." }, { status: 409 });
    }

    const now = getNow();
    const active = await prisma.emailCode.findFirst({
      where: { email, purpose: "add-email", userId: session.userId, isUsed: false, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });
    if (active) {
      return NextResponse.json({ ok: true, ...devOnlyPayload({ devCode: active.code }) });
    }

    const code = generateEmailCode();
    await prisma.emailCode.create({
      data: {
        email,
        code,
        purpose: "add-email",
        userId: session.userId,
        expiresAt: getEmailCodeExpiry(),
      },
    });

    await sendVerificationCodeEmail(email, code);

    return NextResponse.json({ ok: true, ...devOnlyPayload({ devCode: code }) });
  } catch (err) {
    console.error("[account/email/request-code]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
