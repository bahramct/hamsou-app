// ─────────────────────────────────────────────────────────────────────────────
// History — تاریخچه تعهدهای کاربر (TASK-008)
//
// Server Component: اولین صفحه (۱۰ آیتم) مستقیماً از Prisma خوانده می‌شود.
// Client Component (HistoryList): صفحات بعدی را با Infinite Scroll می‌گیرد.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { formatJalali, formatWeekday } from "@/lib/utils/date";
import { HistoryList } from "@/components/features/history/HistoryList";
import type { HistoryItem } from "@/types/history";

const PAGE_SIZE = 10;

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // اولین صفحه — مستقیم از DB (بدون HTTP round-trip)
  const entries = await prisma.dailyEntry.findMany({
    where: { userId: user.userId },
    orderBy: { date: "desc" },
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      content: true,
      date: true,
      feedback: { select: { status: true, note: true } },
    },
  });

  const hasMore = entries.length > PAGE_SIZE;
  const pageItems = hasMore ? entries.slice(0, PAGE_SIZE) : entries;

  const items: HistoryItem[] = pageItems.map((e) => ({
    id: e.id,
    content: e.content,
    date: e.date.toISOString(),
    dateLabel: formatJalali(e.date),
    weekdayLabel: formatWeekday(e.date),
    feedback: e.feedback
      ? { status: e.feedback.status as "DONE" | "NOT_DONE", note: e.feedback.note }
      : null,
  }));

  const nextCursor = hasMore ? pageItems[pageItems.length - 1].date.toISOString() : null;

  return (
    <AppShell>
      {/* ───── محتوا ───── */}
      <div className="flex-1 max-w-xl mx-auto w-full px-5 py-8 sm:py-12 animate-fade-up">
        {/* عنوان */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">تاریخچه تعهدها</h1>
          {items.length > 0 && (
            <p className="text-sm text-stone mt-0.5">از جدیدترین به قدیمی‌ترین</p>
          )}
        </div>

        <HistoryList
          initialItems={items}
          initialCursor={nextCursor}
          initialHasMore={hasMore}
        />
      </div>
    </AppShell>
  );
}
