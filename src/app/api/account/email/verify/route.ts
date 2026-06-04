// ─────────────────────────────────────────────────────────────────────────────
// POST /api/account/email/verify — تأییدِ ایمیلِ افزوده‌شده به کاربرِ واردشده (DECISION-058)
//
// body: { email, code }
// - کدِ معتبرِ add-email متعلق به همین کاربر را مصرف می‌کند
// - email + emailVerifiedAt روی User ذخیره می‌شود
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { normalizeEmail } from "@/lib/auth/credentials";
import { getNow } from "@/lib/dev/time";

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: unknown; code?: unknown }
      | null;
    const email = normalizeEmail(body?.email);
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!email || !code) {
      return NextResponse.json({ error: "ایمیل و کد الزامی‌اند." }, { status: 400 });
    }

    const record = await prisma.emailCode.findFirst({
      where: {
        email,
        code,
        purpose: "add-email",
        userId: session.userId,
        isUsed: false,
        expiresAt: { gt: getNow() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!record) {
      return NextResponse.json({ error: "کد تأیید نادرست یا منقضی شده است." }, { status: 401 });
    }

    // ممکن است در این فاصله ایمیل توسط کاربرِ دیگری گرفته شده باشد
    const owner = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (owner && owner.id !== session.userId) {
      await prisma.emailCode.update({ where: { id: record.id }, data: { isUsed: true } });
      return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده است." }, { status: 409 });
    }

    await prisma.emailCode.update({ where: { id: record.id }, data: { isUsed: true } });
    await prisma.user.update({
      where: { id: session.userId },
      data: { email, emailVerifiedAt: getNow() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account/email/verify]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
