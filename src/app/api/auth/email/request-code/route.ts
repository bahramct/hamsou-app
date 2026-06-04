// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/email/request-code — مرحلهٔ ۱ از ثبت‌نامِ ایمیلی (DECISION-058)
//
// body: { email, password }
// - اعتبارسنجیِ ایمیل + پسورد
// - اگر ایمیل قبلاً ثبت‌نامِ تأییدشده دارد → خطا (راهنمایی به ورود)
// - پسورد hash شده و همراهِ کد در EmailCode «معلق» ذخیره می‌شود (کاربر هنوز ساخته نمی‌شود)
// - کد از طریق EmailAdapter ارسال می‌شود؛ در dev با devOnlyPayload به UI برمی‌گردد
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getEmailAdapter } from "@/lib/adapters";
import { normalizeEmail, generateEmailCode, getEmailCodeExpiry } from "@/lib/auth/credentials";
import { hashPassword, validateUserPassword } from "@/lib/auth/password";
import { devOnlyPayload } from "@/lib/utils/dev-response";
import { getNow } from "@/lib/dev/time";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: unknown; password?: unknown }
      | null;
    if (!body) {
      return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
    }

    const pwCheck = validateUserPassword(body.password);
    if (!pwCheck.ok) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }
    const password = body.password as string;

    // ایمیل قبلاً ثبت‌نامِ کامل دارد؟
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است. وارد شو." },
        { status: 409 }
      );
    }

    const now = getNow();

    // rate limit ساده: اگر کدِ معتبرِ فعالی برای این ایمیل هست، همان را برگردان
    const activeCode = await prisma.emailCode.findFirst({
      where: { email, purpose: "signup", isUsed: false, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });
    if (activeCode) {
      return NextResponse.json({
        ok: true,
        ...devOnlyPayload({ devCode: activeCode.code }),
      });
    }

    const code = generateEmailCode();
    await prisma.emailCode.create({
      data: {
        email,
        code,
        purpose: "signup",
        passwordHash: hashPassword(password),
        expiresAt: getEmailCodeExpiry(),
      },
    });

    const mailer = getEmailAdapter();
    await mailer.sendVerificationCode(email, code);

    return NextResponse.json({
      ok: true,
      ...devOnlyPayload({ devCode: code }),
    });
  } catch (err) {
    console.error("[email/request-code]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
