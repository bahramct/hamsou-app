// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — صفحه اصلی کاربر پس از ورود (TASK-005, TASK-DASHBOARD-HISTORY,
//   TASK-28 «یکپارچه‌سازی داشبورد»)
//
// Server Component. چیدمانِ یکپارچه:
//   ① ردیفِ بالا: «کادر سبز» (TodayPanel: ساعت + هفته) | «امروز» (هیروِ گیت‌دار)
//   ② «مسیرِ من» (بِنتو): هدفِ فعال · نبضِ هفته · تاریخچهٔ اخیر · آخرین گزارش · پلن/کیف
//
// هیروِ «امروز» همان گیتینگِ قبلی است (دست‌نخورده):
//   freeze فعال → FreezeActiveBanner · بازخورد pending → FeedbackForm
//   gap pending → GapForm · تعهد دارد → EntryCard · بدون تعهد → EntryForm
// بِنتو و کادر سبز همیشه (حتی هنگام گیت) نمایش داده می‌شوند.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import {
  getTodayDateForDB,
  canEdit,
  formatJalali,
  formatWeekday,
  jalaaliTodayParts,
  JALALI_MONTH_NAMES,
} from "@/lib/utils/date";
import { EntryForm } from "@/components/features/entry/EntryForm";
import { EntryCard } from "@/components/features/entry/EntryCard";
import { FeedbackForm } from "@/components/features/feedback/FeedbackForm";
import { GapForm } from "@/components/features/gap/GapForm";
import { FreezeActiveBanner } from "@/components/features/freeze/FreezeActiveBanner";
import { createNotification } from "@/lib/notifications/server";
import { getWeekActivity } from "@/lib/dashboard/activity";
import { loadActiveGoalView } from "@/lib/goal/server";
import { buildJourneyNodes } from "@/lib/goal/storyboard";
import { todayKey } from "@/lib/goal/dates";
import { getEffectivePlan } from "@/lib/plans/effective";
import { TodayPanel } from "@/components/features/dashboard/TodayPanel";
import { GoalTile, type GoalTileData, type GoalTimelineNode } from "@/components/features/dashboard/GoalTile";
import { PulseTile } from "@/components/features/dashboard/PulseTile";
import { RecentTile } from "@/components/features/dashboard/RecentTile";
import { ReportTile, type ReportTileData } from "@/components/features/dashboard/ReportTile";
import { PlanTile, type PlanTileData } from "@/components/features/dashboard/PlanTile";
import { SupportCenter, type TicketSummary } from "@/components/features/support/SupportCenter";
import { planAllows } from "@/lib/plans/access";
import { TICKETING_FEATURE_KEY } from "@/lib/support/tickets";
import type { RecentEntry } from "@/components/features/history/RecentHistoryModal";
import type { SerializedEntry } from "@/types/entry";
import type { PendingFeedbackEntry } from "@/types/feedback";
import type { PendingGap, ActiveFreeze } from "@/types/gap";
import type { WeeklyReportContent } from "@/types/weekly-report";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const PLAN_LABEL: Record<string, string> = { FREE: "رایگان", PLUS: "پلاس", PRO: "پرو" };
const PLAN_TONE: Record<string, PlanTileData["tone"]> = { FREE: "free", PLUS: "plus", PRO: "pro" };

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const todayDate = getTodayDateForDB();
  const todayLabel = formatJalali(todayDate);
  const weekdayLabel = formatWeekday(todayDate);
  const todayIso = todayKey();

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

  // ─── اعلانِ پایان فریز (lazy) ────────────────────────────────────────────
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
    where: { userId: user.userId, date: { lt: todayDate }, feedback: null },
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
  if (!activeGapFreeze && !pendingFeedbackEntry && !entry) {
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

        const gapDays =
          Math.round((gapToDate.getTime() - dayAfterLastEntry.getTime()) / MS_PER_DAY) + 1;

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

  // ─── Serialize تعهد امروز ─────────────────────────────────────────────────
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

  // ─── دادهٔ «مسیرِ من» (بِنتو) — همیشه ────────────────────────────────────
  const [weekActivity, goalView, latestReport, effectivePlan, fullUser, recentRows] =
    await Promise.all([
      getWeekActivity(user.userId),
      loadActiveGoalView(user.userId),
      prisma.weeklyReport.findFirst({
        where: { userId: user.userId },
        orderBy: { weekStart: "desc" },
      }),
      getEffectivePlan(user.userId),
      prisma.user.findUnique({
        where: { id: user.userId },
        select: { walletBalance: true, planCycle: true, displayName: true },
      }),
      prisma.dailyEntry.findMany({
        where: { userId: user.userId },
        orderBy: { date: "desc" },
        take: 30,
        select: {
          id: true,
          content: true,
          date: true,
          feedback: { select: { status: true } },
        },
      }),
    ]);

  // GoalTile — تایم‌لاینِ ریز: پنجره‌ای حداکثر ۸ نقطه حولِ امروز
  let goalTimeline: GoalTimelineNode[] = [];
  if (goalView.goal) {
    const nodes = buildJourneyNodes(
      goalView.goal.startIso,
      goalView.goal.endIso,
      todayIso,
      goalView.stories,
      goalView.insights,
    );
    const total = nodes.length;
    let startIdx = 0;
    let endIdx = total;
    if (total > 8) {
      const tIdx = Math.max(0, goalView.goal.dayNumber - 1);
      startIdx = Math.max(0, Math.min(tIdx - 4, total - 8));
      endIdx = startIdx + 8;
    }
    goalTimeline = nodes.slice(startIdx, endIdx).map((n) => {
      const story = n.stories[0];
      const long = !!story && story.content.length > 120;
      return {
        dayNumber: n.dayNumber,
        weekdayLabel: n.weekdayLabel,
        kind: n.isToday ? "today" : n.isFuture ? "future" : "filled",
        preview: story ? (long ? story.content.slice(0, 120) + "…" : story.content) : null,
        hasMore: long,
      };
    });
  }

  const goalTileData: GoalTileData = goalView.goal
    ? {
        hasGoal: true,
        type: goalView.goal.type,
        title: goalView.goal.title,
        dayNumber: goalView.goal.dayNumber,
        totalDays: goalView.goal.totalDays,
        timeline: goalTimeline,
        todayStory: goalView.stories.find((s) => s.dateIso === todayIso)?.content ?? null,
        companionPlanAllowed: goalView.companion.planAllowed,
        companionLatest:
          goalView.insights.length > 0
            ? goalView.insights[goalView.insights.length - 1].reflection
            : null,
      }
    : {
        hasGoal: false,
        type: "goal",
        title: "",
        dayNumber: 0,
        totalDays: 0,
        timeline: [],
        todayStory: null,
        companionPlanAllowed: goalView.companion.planAllowed,
        companionLatest: null,
      };

  // ReportTile
  let reportData: ReportTileData = {
    hasReport: false,
    jalaliStart: "",
    jalaliEnd: "",
    text: "",
    categories: [],
  };
  if (latestReport) {
    try {
      const parsed = JSON.parse(latestReport.aiContent) as { content: WeeklyReportContent };
      const content = parsed.content;
      reportData = {
        hasReport: true,
        jalaliStart: formatJalali(latestReport.weekStart),
        jalaliEnd: formatJalali(latestReport.weekEnd),
        text: content.reflection || content.summary || "",
        categories: (content.categories ?? []).map((c) => c.label),
      };
    } catch {
      /* payload خراب → دعوتِ ساده */
    }
  }

  // PlanTile
  const planTileData: PlanTileData = {
    planLabel: PLAN_LABEL[effectivePlan.plan] ?? effectivePlan.plan,
    tone: PLAN_TONE[effectivePlan.plan] ?? "free",
    daysLeft: effectivePlan.daysLeft,
    walletBalance: fullUser?.walletBalance ?? 0,
    cycleLabel:
      effectivePlan.plan !== "FREE" && fullUser?.planCycle
        ? fullUser.planCycle === "annual"
          ? "سالانه"
          : "ماهانه"
        : null,
  };

  // RecentTile
  const recentEntries: RecentEntry[] = recentRows.map((r) => ({
    id: r.id,
    content: r.content,
    dateLabel: formatJalali(r.date),
    weekdayLabel: formatWeekday(r.date),
    feedbackStatus: r.feedback ? (r.feedback.status as "DONE" | "NOT_DONE") : null,
  }));

  // پشتیبانی — دراورِ همین‌صفحه‌ای (DECISION-102 #1): لینکِ «پشتیبانی» در PlanTile بازش می‌کند
  const ticketingAllowed = await planAllows(effectivePlan.plan, TICKETING_FEATURE_KEY);
  const supportTicketsRaw = await prisma.supportTicket.findMany({
    where: { userId: user.userId },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: { id: true, subject: true, category: true, status: true, lastMessageAt: true },
  });
  const supportTickets: TicketSummary[] = supportTicketsRaw.map((t) => ({
    id: t.id,
    subject: t.subject,
    category: t.category,
    status: t.status,
    lastMessageAt: t.lastMessageAt.toISOString(),
  }));

  const monthLabel = JALALI_MONTH_NAMES[jalaaliTodayParts().jm - 1];
  const dateLabel = `${weekdayLabel}، ${todayLabel}`;

  // ─── هیروِ «امروز» (گیتینگِ دست‌نخورده) ───────────────────────────────
  const heroNode = activeFreeze ? (
    <FreezeActiveBanner freeze={activeFreeze} todayLabel={todayLabel} weekdayLabel={weekdayLabel} />
  ) : pendingFeedbackEntry ? (
    <FeedbackForm pendingEntry={pendingFeedbackEntry} todayLabel={todayLabel} weekdayLabel={weekdayLabel} />
  ) : pendingGap ? (
    <GapForm pendingGap={pendingGap} todayLabel={todayLabel} weekdayLabel={weekdayLabel} />
  ) : serializedEntry ? (
    <EntryCard entry={serializedEntry} todayLabel={todayLabel} weekdayLabel={weekdayLabel} />
  ) : (
    <EntryForm todayLabel={todayLabel} weekdayLabel={weekdayLabel} />
  );

  return (
    <AppShell>
      <div className="dsh-wrap animate-fade-up">
        {/* ① ردیفِ بالا: تعهد امروز (راست) | کادر سبز (چپ) */}
        <div className="dsh-top">
          <div className="dsh-today-col">
            <div className="flex flex-1 items-center justify-center">{heroNode}</div>
          </div>
          <div className="dsh-green-col">
            <TodayPanel
              days={weekActivity.days}
              dateLabel={dateLabel}
              monthLabel={monthLabel}
              userName={fullUser?.displayName ?? undefined}
            />
          </div>
        </div>

        {/* ② مسیرِ من */}
        <div className="dsh-sec">
          <h2>مسیرِ من</h2>
          <span className="rule" />
          <span className="hint">یک نگاهِ آرام به جایی که هستم</span>
        </div>

        {/* بِنتو — سیستمِ قابِ ثابت (DECISION-099): هر تایل footprintِ ثابت (N×M)؛
            ترتیبِ DOM = هدف، نبض، تاریخچه، گزارش، پلن → هدف ۷×۲ راست، بقیه چپ/پایین */}
        <div className="dsh-bento">
          <GoalTile data={goalTileData} />
          <PulseTile
            days={weekActivity.days}
            wroteCount={weekActivity.wroteCount}
            freezeCount={weekActivity.freezeCount}
            emptyCount={weekActivity.emptyCount}
            todayWrote={weekActivity.todayWrote}
          />
          <RecentTile entries={recentEntries} />
          <ReportTile data={reportData} />
          <PlanTile data={planTileData} />
        </div>

        {/* دراورِ پشتیبانی — فقط دراور (بدون کارت)؛ با لینکِ «پشتیبانی» در PlanTile باز می‌شود */}
        <SupportCenter variant="drawer" ticketingAllowed={ticketingAllowed} initialTickets={supportTickets} />
      </div>
    </AppShell>
  );
}
