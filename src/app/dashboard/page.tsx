// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — صفحه اصلی کاربر پس از ورود (TASK-005, TASK-DASHBOARD-HISTORY)
//
// این یک Server Component است:
//   ● Session را از cookie می‌خواند (auth-server.ts)
//   ● تعهد امروز را مستقیماً از Prisma می‌خواند (بدون HTTP round-trip)
//   ● داده را Serialize می‌کند و به Client Components پاس می‌دهد
//
// حالت‌های صفحه:
//   ● بدون تعهد → EntryForm نمایش داده می‌شود
//   ● تعهد دارد  → EntryCard نمایش داده می‌شود (با منطق lock/edit درون خودش)
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { getTodayDateForDB, canEdit, formatJalali, formatWeekday } from "@/lib/utils/date";
import { EntryForm } from "@/components/features/entry/EntryForm";
import { EntryCard } from "@/components/features/entry/EntryCard";
import { FeedbackForm } from "@/components/features/feedback/FeedbackForm";
import { GapForm } from "@/components/features/gap/GapForm";
import { RecentHistoryButton } from "@/components/features/history/RecentHistoryModal";
import type { RecentEntry } from "@/components/features/history/RecentHistoryModal";
import type { SerializedEntry } from "@/types/entry";
import type { PendingFeedbackEntry } from "@/types/feedback";
import type { PendingGap } from "@/types/gap";

export default async function DashboardPage() {
  // ۱. بررسی session (دفاع در عمق — middleware هم محافظت می‌کند)
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // ۲. محاسبه تاریخ امروز برای نمایش و کوئری
  const todayDate = getTodayDateForDB();
  const todayLabel = formatJalali(todayDate);
  const weekdayLabel = formatWeekday(todayDate);

  // ۳. چک تعهد قبلی بدون بازخورد (جدیدترین تعهد قبل از امروز که هنوز feedback ندارد)
  //    اگر موجود باشد، قبل از هر چیز دیگری بازخورد گرفته می‌شود.
  const pendingFeedbackRow = await prisma.dailyEntry.findFirst({
    where: {
      userId: user.userId,
      date: { lt: todayDate },
      feedback: null,
    },
    orderBy: { date: "desc" },
  });

  const pendingFeedbackEntry: PendingFeedbackEntry | null = pendingFeedbackRow
    ? {
        id: pendingFeedbackRow.id,
        content: pendingFeedbackRow.content,
        dateLabel: formatJalali(pendingFeedbackRow.date),
        weekdayLabel: formatWeekday(pendingFeedbackRow.date),
      }
    : null;

  // ۴. خواندن تعهد امروز از DB
  const entry = await prisma.dailyEntry.findUnique({
    where: { userId_date: { userId: user.userId, date: todayDate } },
  });

  // ۵. تشخیص فاصله غیرفعالی — فقط اگر بازخورد pending نیست و تعهد امروز هم نیست
  //    شرط: آخرین تعهد کاربر مربوط به قبل از دیروز باشد و GapRecord برای آن وجود نداشته باشد
  let pendingGap: PendingGap | null = null;

  if (!pendingFeedbackEntry && !entry) {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const yesterday = new Date(todayDate.getTime() - MS_PER_DAY);

    const lastEntry = await prisma.dailyEntry.findFirst({
      where: { userId: user.userId },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    if (lastEntry && lastEntry.date < yesterday) {
      const dayAfterLastEntry = new Date(lastEntry.date.getTime() + MS_PER_DAY);

      const existingGap = await prisma.gapRecord.findFirst({
        where: { userId: user.userId, fromDate: dayAfterLastEntry },
        select: { id: true },
      });

      if (!existingGap) {
        const gapDays = Math.round(
          (todayDate.getTime() - lastEntry.date.getTime()) / MS_PER_DAY
        ) - 1;

        pendingGap = {
          fromDateLabel: formatJalali(dayAfterLastEntry),
          toDateLabel: formatJalali(yesterday),
          days: gapDays,
        };
      }
    }
  }

  // ۶. آخرین ۷ تعهد برای دکمه تاریخچه (فقط در حالت عادی — نه در gates)
  //    gap ها skip می‌شوند چون فقط رکوردهای موجود خوانده می‌شود
  const recentEntries: RecentEntry[] = [];
  if (!pendingFeedbackEntry && !pendingGap) {
    const recentRows = await prisma.dailyEntry.findMany({
      where: { userId: user.userId },
      orderBy: { date: "desc" },
      take: 7,
      select: {
        id: true,
        content: true,
        date: true,
        feedback: { select: { status: true } },
      },
    });
    recentEntries.push(
      ...recentRows.map((r) => ({
        id: r.id,
        content: r.content,
        dateLabel: formatJalali(r.date),
        weekdayLabel: formatWeekday(r.date),
        feedbackStatus: r.feedback
          ? (r.feedback.status as "DONE" | "NOT_DONE")
          : null,
      }))
    );
  }

  // ۷. Serialize برای Client Components (Date → ISO string)
  const serializedEntry: SerializedEntry | null = entry
    ? {
        id: entry.id,
        content: entry.content,
        createdAt: entry.createdAt.toISOString(),
        editableUntil: entry.editableUntil.toISOString(),
        isLocked: entry.isLocked,
        canEdit: !entry.isLocked && canEdit(entry.editableUntil),
        wasEdited: entry.editedAt !== null,
      }
    : null;

  return (
    <AppShell>
      {/* ───── ناحیه اصلی — flex-1 کل فضا را می‌گیرد، center دقیق حفظ می‌شود ───── */}
      <div className="flex-1 relative flex items-center justify-center px-5 pt-12 pb-28 sm:pt-16 sm:pb-32">
        <div className="w-full flex justify-center">
          {pendingFeedbackEntry ? (
            // گیت ۱: بازخورد تعهد قبلی — پیش از هر چیز
            <FeedbackForm
              pendingEntry={pendingFeedbackEntry}
              todayLabel={todayLabel}
              weekdayLabel={weekdayLabel}
            />
          ) : pendingGap ? (
            // گیت ۲: توضیح فاصله غیرفعالی — بعد از بازخورد، قبل از تعهد امروز
            <GapForm
              pendingGap={pendingGap}
              todayLabel={todayLabel}
              weekdayLabel={weekdayLabel}
            />
          ) : serializedEntry ? (
            <EntryCard
              entry={serializedEntry}
              todayLabel={todayLabel}
              weekdayLabel={weekdayLabel}
            />
          ) : (
            <EntryForm todayLabel={todayLabel} weekdayLabel={weekdayLabel} />
          )}
        </div>

        {/* دکمه تاریخچه — absolute در پایین؛ روی flex-1 overlay می‌شود تا center کارت تغییر نکند */}
        {recentEntries.length > 0 && (
          <div className="absolute bottom-6 sm:bottom-8 inset-x-0 flex justify-center">
            <RecentHistoryButton entries={recentEntries} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
