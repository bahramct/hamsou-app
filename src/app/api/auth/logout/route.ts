// POST /api/auth/logout
// پاک کردن session cookie
//
// دو حالت کاربرد:
//   ۱. فراخوانی از فرم HTML (dashboard nav): Accept: text/html → redirect به /login
//   ۲. فراخوانی از DevResetPanel (fetch): Accept: application/json → JSON { ok: true }
//      (DevResetPanel پس از این فراخوانی، خودش window.location.href را تغییر می‌دهد)

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/utils/session";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  // اگر درخواست از فرم HTML آمده (مرورگر text/html می‌فرستد) → صفحه اصلی (landing)
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // درخواست‌های fetch (مثل DevResetPanel) → JSON
  return NextResponse.json({ ok: true });
}
