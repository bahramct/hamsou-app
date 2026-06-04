// ─────────────────────────────────────────────────────────────────────────────
// support/nav-counts.ts — شمارِ badgeهای سایدبار پنل (تیکت باز + چت خوانده‌نشده)
//
// منبع واحد برای هم مقدار اولیهٔ layout (server) و هم endpoint poll (client).
// «تیکت باز» = هر تیکتِ بسته‌نشده. «چت خوانده‌نشده» = سشن‌های دارای پیام کاربرِ
// خوانده‌نشده توسط پشتیبان. هر خطا → صفر (badge هرگز جریان پنل را نمی‌شکند).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { OPEN_STATUSES } from "@/lib/support/tickets";

export interface SupportNavCounts {
  openTickets: number;
  unreadChats: number;
}

export async function getSupportNavCounts(): Promise<SupportNavCounts> {
  try {
    const [openTickets, unreadChats] = await Promise.all([
      prisma.supportTicket.count({ where: { status: { in: [...OPEN_STATUSES] } } }),
      prisma.supportChatSession.count({
        where: { messages: { some: { authorType: "user", readByAdminAt: null } } },
      }),
    ]);
    return { openTickets, unreadChats };
  } catch {
    return { openTickets: 0, unreadChats: 0 };
  }
}
