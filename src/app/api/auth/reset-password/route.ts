// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/auth/reset-password?token=... — اعتبارسنجی توکن
// POST /api/auth/reset-password — تغییر رمز
//
// GET: فقط چک می‌کند توکن معتبر است (صفحه قبل از نمایش فرم استفاده می‌کند)
// POST body: { token, password }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { hashPassword, validateUserPassword } from "@/lib/auth/password";
import { getNow } from "@/lib/dev/time";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
    if (!token || token.length !== 64) {
      return NextResponse.json({ valid: false, error: "لینک بازیابی نادرست است." });
    }

    const record = await prisma.emailCode.findFirst({
      where: {
        code: token,
        purpose: "reset-password",
        isUsed: false,
        expiresAt: { gt: getNow() },
      },
      select: { id: true },
    });

    if (!record) {
      return NextResponse.json({ valid: false, error: "لینک بازیابی نادرست یا منقضی شده است." });
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error("[reset-password GET]", err);
    return NextResponse.json({ valid: false, error: "خطای سرور." });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { token?: unknown; password?: unknown }
      | null;
    if (!body) {
      return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token || token.length !== 64) {
      return NextResponse.json({ error: "لینک بازیابی نادرست است." }, { status: 400 });
    }

    const pwCheck = validateUserPassword(body.password);
    if (!pwCheck.ok) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }
    const newPassword = body.password as string;

    const now = getNow();
    const record = await prisma.emailCode.findFirst({
      where: {
        code: token,
        purpose: "reset-password",
        isUsed: false,
        expiresAt: { gt: now },
      },
    });

    if (!record || !record.email) {
      return NextResponse.json(
        { error: "لینک بازیابی نادرست یا منقضی شده است." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: record.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.emailCode.update({ where: { id: record.id }, data: { isUsed: true } }),
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(newPassword) },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password POST]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
