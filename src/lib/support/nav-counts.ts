// ─────────────────────────────────────────────────────────────────────────────
// support/nav-counts.ts — شمارِ badgeهای سایدبار پنل (تیکت باز + چت خوانده‌نشده)
//
// منبع واحد برای هم مقدار اولیهٔ layout (server) و هم endpoint poll (client).
// «تیکت باز» = تیکتِ بسته‌نشده‌ای که آخرین پیامش بعد از ticketsSinceMs رسیده.
// «چت خوانده‌نشده» = سشنِ دارای پیام کاربرِ خوانده‌نشده بعد از chatsSinceMs.
// بدون پارامتر → همهٔ موارد (برای اولین بار / سرور-ساید render).
// هر خطا → صفر (badge هرگز جریان پنل را نمی‌شکند).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { OPEN_STATUSES } from "@/lib/support/tickets";

export interface SupportNavCounts {
  openTickets: number;
  unreadChats: number;
}

export async function getSupportNavCounts(
  ticketsSinceMs?: number,
  chatsSinceMs?: number,
): Promise<SupportNavCounts> {
  try {
    const ticketsSince =
      ticketsSinceMs && ticketsSinceMs > 0 ? new Date(ticketsSinceMs) : undefined;
    const chatsSince =
      chatsSinceMs && chatsSinceMs > 0 ? new Date(chatsSinceMs) : undefined;

    const [openTickets, unreadChats] = await Promise.all([
      prisma.supportTicket.count({
        where: {
          status: { in: [...OPEN_STATUSES] },
          ...(ticketsSince ? { lastMessageAt: { gt: ticketsSince } } : {}),
        },
      }),
      prisma.supportChatSession.count({
        where: {
          messages: {
            some: {
              authorType: "user",
              readByAdminAt: null,
              ...(chatsSince ? { createdAt: { gt: chatsSince } } : {}),
            },
          },
        },
      }),
    ]);
    return { openTickets, unreadChats };
  } catch {
    return { openTickets: 0, unreadChats: 0 };
  }
}
