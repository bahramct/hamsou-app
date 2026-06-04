// GET /api/admin/nav-counts — شمارِ badgeهای سایدبار پنل (تیکت باز + چت خوانده‌نشده)
// AdminShell این را با فاصلهٔ آرام poll می‌کند تا badgeها زنده بمانند.
// بدون support.read → صفر (آیتم‌ها را اصلاً نمی‌بیند).

import { NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { getSupportNavCounts } from "@/lib/support/nav-counts";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!can(ctx, "support.read")) {
    return NextResponse.json({ ok: true, openTickets: 0, unreadChats: 0 });
  }
  const counts = await getSupportNavCounts();
  return NextResponse.json({ ok: true, ...counts });
}
