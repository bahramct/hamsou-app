// ─────────────────────────────────────────────────────────────────────────────
// /api/account
//
// DELETE — حذف کامل حساب کاربری
//
// برای جلوگیری از حذف تصادفی، کاربر باید شماره موبایل خود را تأیید کند.
// body: { phone: string }  — باید با شماره موبایل حساب match کند
//
// پس از حذف: cookie پاک می‌شود و کاربر به / هدایت می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { normalizeIranPhone } from "@/lib/utils/otp";
import { normalizeEmail } from "@/lib/auth/credentials";
import { SESSION_COOKIE } from "@/lib/utils/session";

export async function DELETE(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { confirm?: unknown; phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // شناسهٔ تأیید — phone برای سازگاریِ قدیمی، confirm برای هر دو روش (DECISION-058)
  const raw = typeof body.confirm === "string" ? body.confirm : typeof body.phone === "string" ? body.phone : "";

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { phone: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  // ورودی باید با موبایل یا ایمیلِ حساب match کند
  const matchesPhone = user.phone != null && normalizeIranPhone(raw) === user.phone;
  const matchesEmail = user.email != null && normalizeEmail(raw) === user.email;

  if (!matchesPhone && !matchesEmail) {
    return NextResponse.json(
      {
        ok: false,
        error: "confirm_mismatch",
        message: "مقدار وارد شده با حساب شما مطابقت ندارد",
      },
      { status: 422 }
    );
  }

  // حذف cascade (Prisma schema: onDelete: Cascade روی همه relations)
  // ترتیب: User حذف می‌شود → همه entries، feedback، gap، weekly reports هم حذف می‌شوند
  await prisma.user.delete({ where: { id: session.userId } });

  // پاک کردن session cookie
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
