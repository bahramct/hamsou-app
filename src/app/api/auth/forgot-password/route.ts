// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password — درخواست بازیابی رمز عبور
//
// body: { identifier } — ایمیل یا نام‌کاربری
// - کاربر را پیدا می‌کند (email یا username)
// - اگر پیدا شد و ایمیل دارد → توکن ۳۲-بایتی می‌سازد و لینک می‌فرستد
// - پاسخ همیشه ۲۰۰ است (security: نمی‌گوییم آیا حساب وجود دارد یا نه)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getEmailAdapter } from "@/lib/adapters";
import { normalizeEmail, normalizeUsername, generateEmailToken, getResetLinkExpiry } from "@/lib/auth/credentials";
import { devOnlyPayload } from "@/lib/utils/dev-response";
import { getNow } from "@/lib/dev/time";
import { getAppBaseUrl } from "@/lib/utils/app-url";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { identifier?: unknown } | null;
    if (!body) {
      return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });
    }

    const raw = typeof body.identifier === "string" ? body.identifier.trim() : "";
    if (!raw) {
      return NextResponse.json({ error: "ایمیل یا نام کاربری الزامی است." }, { status: 400 });
    }

    // شناسایی نوع ورودی: ایمیل یا نام‌کاربری
    const asEmail = normalizeEmail(raw);
    const asUsername = normalizeUsername(raw.toLowerCase());

    let userEmail: string | null = null;

    if (asEmail) {
      const user = await prisma.user.findUnique({
        where: { email: asEmail },
        select: { email: true, passwordHash: true },
      });
      // فقط کاربرانی که رمز دارند (ایمیل/یوزرنیم ثبت کردند، نه OTP)
      if (user?.email && user.passwordHash) {
        userEmail = user.email;
      }
    } else if (asUsername) {
      const user = await prisma.user.findUnique({
        where: { username: asUsername },
        select: { email: true, passwordHash: true },
      });
      if (user?.email && user.passwordHash) {
        userEmail = user.email;
      }
    }

    // پاسخ همیشه ۲۰۰ (جلوگیری از user enumeration)
    if (!userEmail) {
      return NextResponse.json({
        ok: true,
        ...devOnlyPayload({ devNote: "کاربر پیدا نشد یا ایمیل ندارد" }),
      });
    }

    const now = getNow();

    // rate limit: اگر توکنِ فعالی هست، همان را برگردان
    const active = await prisma.emailCode.findFirst({
      where: { email: userEmail, purpose: "reset-password", isUsed: false, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });
    const token = active?.code ?? generateEmailToken();
    const link = `${getAppBaseUrl()}/reset-password?token=${token}`;

    if (!active) {
      await prisma.emailCode.create({
        data: {
          email: userEmail,
          code: token,
          purpose: "reset-password",
          expiresAt: getResetLinkExpiry(),
        },
      });
    }

    const mailer = getEmailAdapter();
    await mailer.sendPasswordResetLink(userEmail, link);

    return NextResponse.json({
      ok: true,
      ...devOnlyPayload({ devLink: link }),
    });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
