// POST /api/admin/auth/logout
// پاک کردن admin session cookie و بازگشت به /admin/login

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/session";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.json({ ok: true });
}
