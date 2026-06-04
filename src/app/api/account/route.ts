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
import { SESSION_COOKIE } from "@/lib/utils/session";

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const rawPhone = typeof body.phone === "string" ? body.phone : "";
  const normalizedInput = normalizeIranPhone(rawPhone);

  // تأیید شماره — باید با حساب جاری match کند
  if (!normalizedInput || normalizedInput !== user.phone) {
    return NextResponse.json(
      {
        ok: false,
        error: "phone_mismatch",
        message: "شماره موبایل وارد شده با حساب شما مطابقت ندارد",
      },
      { status: 422 }
    );
  }

  // حذف cascade (Prisma schema: onDelete: Cascade روی همه relations)
  // ترتیب: User حذف می‌شود → همه entries، feedback، gap، weekly reports هم حذف می‌شوند
  await prisma.user.delete({ where: { id: user.userId } });

  // پاک کردن session cookie
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
}
