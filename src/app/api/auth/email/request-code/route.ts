// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/email/request-code — مرحلهٔ ۱ از ثبت‌نامِ ایمیلی (DECISION-058)
//
// body: { email, password }
// - اعتبارسنجیِ ایمیل + پسورد
// - پسورد hash شده و همراهِ توکن در EmailCode «معلق» ذخیره می‌شود
// - لینک تأیید از طریق EmailAdapter ارسال می‌شود؛ در dev با devOnlyPayload به UI برمی‌گردد
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { sendVerificationLinkEmail } from "@/lib/email/send";
import {
  normalizeEmail,
  generateEmailToken,
  getVerificationLinkExpiry,
} from "@/lib/auth/credentials";
import { devOnlyPayload } from "@/lib/utils/dev-response";
import { getNow } from "@/lib/dev/time";
import { getAppBaseUrl } from "@/lib/utils/app-url";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: unknown }
      | null;
    if (!body) {
      return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
    }

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

    // rate limit ساده: اگر توکنِ معتبرِ فعالی برای این ایمیل هست، همان را برگردان
    const activeRecord = await prisma.emailCode.findFirst({
      where: { email, purpose: "signup", isUsed: false, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });
    if (activeRecord) {
      const link = `${getAppBaseUrl()}/verify-email?token=${activeRecord.code}`;
      return NextResponse.json({
        ok: true,
        ...devOnlyPayload({ devToken: activeRecord.code, devLink: link }),
      });
    }

    const token = generateEmailToken();
    await prisma.emailCode.create({
      data: {
        email,
        code: token,
        purpose: "signup",
        // رمز عبور پس از تأیید ایمیل در مودال پروفایل تنظیم می‌شود (DECISION-080)
        passwordHash: null,
        expiresAt: getVerificationLinkExpiry(),
      },
    });

    const link = `${getAppBaseUrl()}/verify-email?token=${token}`;
    await sendVerificationLinkEmail(email, link);

    return NextResponse.json({
      ok: true,
      ...devOnlyPayload({ devToken: token, devLink: link }),
    });
  } catch (err) {
    console.error("[email/request-code]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
