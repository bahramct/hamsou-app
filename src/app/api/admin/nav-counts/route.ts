// GET /api/admin/nav-counts — شمارِ badgeهای سایدبار پنل (تیکت باز + چت خوانده‌نشده)
// AdminShell این را با فاصلهٔ آرام poll می‌کند تا badgeها زنده بمانند.
// بدون support.read → صفر (آیتم‌ها را اصلاً نمی‌بیند).

import { NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { getSupportNavCounts } from "@/lib/support/nav-counts";
import { getPendingCommentsCount } from "@/lib/blog/nav-counts";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });

  let openTickets = 0;
  let unreadChats = 0;
  if (can(ctx, "support.read")) {
    const counts = await getSupportNavCounts();
    openTickets = counts.openTickets;
    unreadChats = counts.unreadChats;
  }

  // شارژهای در انتظارِ تأیید (DECISION-062) — فقط برای دارندگان payment.read
  let pendingPayments = 0;
  if (can(ctx, "payment.read")) {
    pendingPayments = await prisma.walletTransaction.count({ where: { type: "topup", status: "pending" } });
  }

  // کامنت‌های بلاگ در انتظارِ تأیید (DECISION-065) — فقط برای دارندگان blog.moderate
  let pendingComments = 0;
  if (can(ctx, "blog.moderate")) {
    pendingComments = await getPendingCommentsCount();
  }

  return NextResponse.json({ ok: true, openTickets, unreadChats, pendingPayments, pendingComments });
}
