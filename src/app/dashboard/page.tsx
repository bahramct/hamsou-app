// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — صفحه اصلی کاربر پس از ورود (TASK-005, TASK-DASHBOARD-HISTORY)
//
// این یک Server Component است:
//   ● Session را از cookie می‌خواند (auth-server.ts)
//   ● تعهد امروز را مستقیماً از Prisma می‌خواند (بدون HTTP round-trip)
//   ● داده را Serialize می‌کند و به Client Components پاس می‌دهد
//
// حالت‌های صفحه (به ترتیب اولویت):
//   ● freeze فعال → FreezeActiveBanner (بدون فرم تعهد)
//   ● بازخورد pending → FeedbackForm
//   ● gap pending → GapForm (با آگاهی از freeze)
//   ● تعهد دارد → EntryCard
//   ● بدون تعهد → EntryForm + FreezePill
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
import { FreezeActiveBanner } from "@/components/features/freeze/FreezeActiveBanner";
import { RecentHistoryButton } from "@/components/features/history/RecentHistoryModal";
import { createNotification } from "@/lib/notifications/server";
import type { RecentEntry } from "@/components/features/history/RecentHistoryModal";
import type { SerializedEntry } from "@/types/entry";
import type { PendingFeedbackEntry } from "@/types/feedback";
import type { PendingGap, ActiveFreeze } from "@/types/gap";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const todayDate = getTodayDateForDB();
  const todayLabel = formatJalali(todayDate);
  const weekdayLabel = formatWeekday(todayDate);

  // ─── بررسی فریز فعال (امروز در بازه فریز) ────────────────────────────────
  const activeGapFreeze = await prisma.gapRecord.findFirst({
    where: {
      userId: user.userId,
      type: "freeze",
      fromDate: { lte: todayDate },
      toDate: { gte: todayDate },
    },
    select: { id: true, fromDate: true, toDate: true, note: true },
  });

  // ─── اعلانِ پایان فریز (lazy — فقط اگر فریزی دیروز تمام شده) ────────────
  const yesterday = new Date(todayDate.getTime() - MS_PER_DAY);
  const endedFreeze = await prisma.gapRecord.findFirst({
    where: {
      userId: user.userId,
      type: "freeze",
      toDate: { gte: new Date(yesterday.getTime() - MS_PER_DAY), lt: todayDate },
    },
    select: { id: true, toDate: true },
  });
  if (endedFreeze) {
    const recentEndNotif = await prisma.notification.findFirst({
      where: {
        userId: user.userId,
        type: "freeze.ended",
        createdAt: { gte: new Date(todayDate.getTime() - 2 * MS_PER_DAY) },
      },
      select: { id: true },
    });
    if (!recentEndNotif) {
      await createNotification({
        type: "freeze.ended",
        userId: user.userId,
        data: { toDateLabel: formatJalali(endedFreeze.toDate) },
      });
    }
  }

  // ─── بازخورد تعهد قبلی ────────────────────────────────────────────────────
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

  // ─── تعهد امروز ───────────────────────────────────────────────────────────
  const entry = await prisma.dailyEntry.findUnique({
    where: { userId_date: { userId: user.userId, date: todayDate } },
  });

  // ─── تشخیص فاصله غیرفعالی (با آگاهی از freeze) ─────────────────────────
  let pendingGap: PendingGap | null = null;

  // اگر freeze فعال نیست، بازخورد pending نیست، تعهد امروز ندارد → چک gap
  if (!activeGapFreeze && !pendingFeedbackEntry && !entry) {
    const lastEntry = await prisma.dailyEntry.findFirst({
      where: { userId: user.userId },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    if (lastEntry && lastEntry.date < yesterday) {
      const dayAfterLastEntry = new Date(lastEntry.date.getTime() + MS_PER_DAY);

      // چک اینکه آیا gap قبلاً ثبت شده
      const existingGap = await prisma.gapRecord.findFirst({
        where: { userId: user.userId, fromDate: dayAfterLastEntry },
        select: { id: true },
      });

      if (!existingGap) {
        // اگر freeze‌ای در بازه gap شروع می‌شود، gap را تا قبل از freeze محدود کن
        const overlapFreeze = await prisma.gapRecord.findFirst({
          where: {
            userId: user.userId,
            type: "freeze",
            fromDate: { gt: dayAfterLastEntry, lte: yesterday },
          },
          orderBy: { fromDate: "asc" },
          select: { fromDate: true },
        });

        const gapToDate = overlapFreeze
          ? new Date(overlapFreeze.fromDate.getTime() - MS_PER_DAY)
          : yesterday;

        const gapDays = Math.round(
          (gapToDate.getTime() - dayAfterLastEntry.getTime()) / MS_PER_DAY,
        ) + 1;

        if (gapDays > 0) {
          pendingGap = {
            fromDateLabel: formatJalali(dayAfterLastEntry),
            toDateLabel: formatJalali(gapToDate),
            days: gapDays,
          };
        }
      }
    }
  }

  // ─── تاریخچه آخرین ۷ تعهد ────────────────────────────────────────────────
  const recentEntries: RecentEntry[] = [];
  if (!activeGapFreeze && !pendingFeedbackEntry && !pendingGap) {
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
      })),
    );
  }

  // ─── Serialize ───────────────────────────────────────────────────────────
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

  const activeFreeze: ActiveFreeze | null = activeGapFreeze
    ? {
        id: activeGapFreeze.id,
        fromDateLabel: formatJalali(activeGapFreeze.fromDate),
        toDateLabel: formatJalali(activeGapFreeze.toDate),
        fromIso: activeGapFreeze.fromDate.toISOString(),
        toIso: activeGapFreeze.toDate.toISOString(),
        note: activeGapFreeze.note,
        daysLeft: Math.max(
          1,
          Math.round((activeGapFreeze.toDate.getTime() - todayDate.getTime()) / MS_PER_DAY) + 1,
        ),
      }
    : null;

  return (
    <AppShell>
      <div className="flex-1 relative flex items-center justify-center px-5 pt-12 pb-28 sm:pt-16 sm:pb-32">
        <div className="w-full flex justify-center">
          {activeFreeze ? (
            // گیت فریز: فریز فعال — بدون فرم تعهد
            <FreezeActiveBanner
              freeze={activeFreeze}
              todayLabel={todayLabel}
              weekdayLabel={weekdayLabel}
            />
          ) : pendingFeedbackEntry ? (
            // گیت ۱: بازخورد تعهد قبلی — پیش از هر چیز
            <FeedbackForm
              pendingEntry={pendingFeedbackEntry}
              todayLabel={todayLabel}
              weekdayLabel={weekdayLabel}
            />
          ) : pendingGap ? (
            // گیت ۲: توضیح فاصله غیرفعالی
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

        {recentEntries.length > 0 && (
          <div className="absolute bottom-6 sm:bottom-8 inset-x-0 flex justify-center">
            <RecentHistoryButton entries={recentEntries} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
