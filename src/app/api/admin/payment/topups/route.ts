// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/payment/topups — فهرست درخواست‌های شارژ (DECISION-062)
//   enforce payment.read. در انتظار اول، سپس تازه‌ترین. شامل اطلاعاتِ کاربر برای تطبیق.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "payment.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  // در انتظار اول (status asc: pending < approved < rejected نیست → مرتب‌سازی دستی)
  const topups = await prisma.walletTransaction.findMany({
    where: { type: "topup" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const userIds = [...new Set(topups.map((t) => t.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, username: true, phone: true, email: true, paymentCardNumber: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const rank = (s: string) => (s === "pending" ? 0 : 1);
  const list = topups
    .map((t) => {
      const u = userMap.get(t.userId);
      return {
        id: t.id,
        refCode: t.refCode,
        amount: t.amount,
        status: t.status,
        payerCardSnapshot: t.payerCardSnapshot,
        adminNote: t.adminNote,
        createdAt: t.createdAt.toISOString(),
        reviewedAt: t.reviewedAt ? t.reviewedAt.toISOString() : null,
        user: u
          ? {
              id: u.id,
              name: u.displayName || (u.username ? `@${u.username}` : null),
              phone: u.phone,
              email: u.email,
              registeredCard: u.paymentCardNumber,
            }
          : null,
      };
    })
    .sort((a, b) => rank(a.status) - rank(b.status) || (a.createdAt < b.createdAt ? 1 : -1));

  return NextResponse.json({ ok: true, topups: list });
}
