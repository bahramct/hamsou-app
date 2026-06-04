// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/account/credentials — تنظیم/تغییرِ نام‌کاربری و رمزِ کاربرِ واردشده (DECISION-058)
//
// body (هر ترکیبی): { username?, newPassword?, currentPassword? }
// - username: اعتبارسنجی + یکتایی → ذخیره (اختیاری؛ با شبکهٔ اجتماعی اجباری می‌شود)
// - newPassword: اگر کاربر از قبل رمز دارد، currentPassword الزامی و باید درست باشد؛
//   اگر بارِ اول است (مثلاً کاربرِ موبایلی)، بدونِ currentPassword هم مجاز است
//   چون هویت با session احراز شده.
//
// GET — وضعیتِ اعتبارنامه‌ها (آیا email/username/password دارد) برای نمایشِ UI
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { normalizeUsername, USERNAME_RULE_FA } from "@/lib/auth/credentials";
import { hashPassword, verifyPassword, validateUserPassword } from "@/lib/auth/password";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, username: true, passwordHash: true, phone: true, emailVerifiedAt: true },
  });
  if (!user) return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    username: user.username,
    hasPassword: user.passwordHash !== null,
    phone: user.phone,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { username?: unknown; newPassword?: unknown; currentPassword?: unknown }
    | null;
  if (!body) return NextResponse.json({ ok: false, error: "درخواست نامعتبر." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true, username: true },
  });
  if (!user) return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });

  const data: { username?: string; passwordHash?: string } = {};

  // ── نام‌کاربری ──
  if ("username" in body && body.username !== undefined && body.username !== null) {
    const uname = normalizeUsername(body.username);
    if (!uname) {
      return NextResponse.json({ ok: false, error: USERNAME_RULE_FA }, { status: 422 });
    }
    if (uname !== user.username) {
      const dup = await prisma.user.findUnique({ where: { username: uname }, select: { id: true } });
      if (dup && dup.id !== session.userId) {
        return NextResponse.json({ ok: false, error: "این نام کاربری قبلاً گرفته شده." }, { status: 409 });
      }
      data.username = uname;
    }
  }

  // ── رمز عبور ──
  if ("newPassword" in body && body.newPassword !== undefined && body.newPassword !== null) {
    const pwCheck = validateUserPassword(body.newPassword);
    if (!pwCheck.ok) {
      return NextResponse.json({ ok: false, error: pwCheck.error }, { status: 422 });
    }
    // اگر رمزِ فعلی وجود دارد، باید currentPassword درست باشد
    if (user.passwordHash) {
      const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
      if (!current || !verifyPassword(current, user.passwordHash)) {
        return NextResponse.json({ ok: false, error: "رمز فعلی نادرست است." }, { status: 403 });
      }
    }
    data.passwordHash = hashPassword(body.newPassword as string);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "تغییری ارسال نشد." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: session.userId }, data });

  return NextResponse.json({ ok: true });
}
