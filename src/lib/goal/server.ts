// ─────────────────────────────────────────────────────────────────────────────
// goal/server.ts — منطقِ سمتِ سرورِ فیچر «برنامه‌ریزی» (DECISION-082)
//
// تنها نقطهٔ مشترکِ خواندنِ «نمای هدفِ فعال» برای GET route و صفحهٔ سرور (/goal).
// شاملِ lazy-completion: اگر امروز از endDate گذشته باشد، هدف active→completed می‌شود
//   و اعلانِ goal.completed یک‌بار ارسال می‌شود (بدون نیاز به cronِ جدا).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { formatJalali, formatWeekday } from "@/lib/utils/date";
import { planAllows } from "@/lib/plans/access";
import { getEffectivePlanKey } from "@/lib/plans/effective";
import { createNotification } from "@/lib/notifications/server";
import {
  goalToday,
  iranDayKey,
  todayKey,
  totalDays,
  currentDayNumber,
  daysRemaining,
  companionWindow,
} from "@/lib/goal/dates";
import type {
  ActiveGoalView,
  GoalMood,
  ReminderChannel,
  SerializedGoal,
  SerializedInsight,
  SerializedStory,
} from "@/types/goal";

const MOODS: GoalMood[] = ["good", "neutral", "hard"];
const CHANNELS: ReminderChannel[] = ["inapp", "email", "both"];

export function isGoalMood(v: unknown): v is GoalMood {
  return typeof v === "string" && (MOODS as string[]).includes(v);
}
export function isReminderChannel(v: unknown): v is ReminderChannel {
  return typeof v === "string" && (CHANNELS as string[]).includes(v);
}

/** "YYYY-MM-DD" → Date در UTC-midnight (مبنای ذخیرهٔ روزهای ایران). نامعتبر → null. */
export function isoToDbDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function serializeGoal(g: {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string;
}): SerializedGoal {
  return {
    id: g.id,
    title: g.title,
    startIso: iranDayKey(g.startDate),
    endIso: iranDayKey(g.endDate),
    startLabel: formatJalali(g.startDate),
    endLabel: formatJalali(g.endDate),
    status: g.status,
    totalDays: totalDays(g.startDate, g.endDate),
    dayNumber: currentDayNumber(g.startDate),
    daysRemaining: daysRemaining(g.endDate),
  };
}

function serializeStory(s: {
  id: string;
  date: Date;
  content: string;
  mood: string | null;
  createdAt: Date;
}): SerializedStory {
  return {
    id: s.id,
    dateIso: iranDayKey(s.date),
    dateLabel: formatJalali(s.date),
    weekdayLabel: formatWeekday(s.date),
    content: s.content,
    mood: isGoalMood(s.mood) ? s.mood : null,
    createdAtIso: s.createdAt.toISOString(),
  };
}

export function serializeInsight(i: {
  id: string;
  dayKey: string;
  dayNumber: number;
  aiContent: string;
  generatedAt: Date;
  goalStart?: Date;
}): SerializedInsight {
  let reflection = "";
  let observations: string[] = [];
  let suggestions: string[] = [];
  try {
    const parsed = JSON.parse(i.aiContent);
    if (parsed && typeof parsed === "object") {
      reflection = typeof parsed.reflection === "string" ? parsed.reflection : "";
      observations = Array.isArray(parsed.observations)
        ? parsed.observations.filter((x: unknown) => typeof x === "string")
        : [];
      suggestions = Array.isArray(parsed.suggestions)
        ? parsed.suggestions.filter((x: unknown) => typeof x === "string")
        : [];
    }
  } catch {
    // payload خراب → متنِ خالی (هرگز crash نمی‌کند)
  }
  // برچسبِ تاریخ از dayKey ("YYYY-MM-DD" ایران) ساخته می‌شود
  const dbDate = isoToDbDate(i.dayKey);
  return {
    id: i.id,
    dayKey: i.dayKey,
    dayNumber: i.dayNumber,
    dateLabel: dbDate ? formatJalali(dbDate) : "",
    reflection,
    observations,
    suggestions,
    generatedAtIso: i.generatedAt.toISOString(),
  };
}

/** هدفِ فعالِ کاربر (با lazy-completion). اگر امروز از پایان گذشته → completed + اعلان. */
export async function getActiveGoal(userId: string) {
  const goal = await prisma.goal.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  if (!goal) return null;

  // lazy-completion: امروزِ ایران از endDate گذشته است
  if (goalToday().getTime() > goal.endDate.getTime()) {
    await prisma.goal.update({ where: { id: goal.id }, data: { status: "completed" } });
    await createNotification({
      userId,
      type: "goal.completed",
      data: { goalTitle: goal.title },
    });
    return null;
  }
  return goal;
}

/** نمای کاملِ «هدفِ فعال» برای GET route و صفحهٔ سرور. */
export async function loadActiveGoalView(userId: string): Promise<ActiveGoalView> {
  const plan = await getEffectivePlanKey(userId);
  const planningAllowed = await planAllows(plan, "goal.planning").catch(() => true);

  const goal = await getActiveGoal(userId);

  if (!goal) {
    return {
      planningAllowed,
      goal: null,
      stories: [],
      insights: [],
      companion: { planAllowed: false, windowOpen: false, usedToday: false, dayNumber: 0, totalDays: 0 },
      reminder: { enabled: false, times: [], channel: "inapp", customMessage: null },
    };
  }

  const [stories, insights, reminder, companionAllowed] = await Promise.all([
    prisma.goalStory.findMany({
      where: { goalId: goal.id },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.goalCompanionInsight.findMany({
      where: { goalId: goal.id },
      orderBy: { dayNumber: "asc" },
    }),
    prisma.goalReminder.findUnique({ where: { goalId: goal.id } }),
    planAllows(plan, "goal.companion").catch(() => false),
  ]);

  const win = companionWindow(goal.startDate, goal.endDate);
  const tk = todayKey();
  const usedToday = insights.some((i) => i.dayKey === tk);

  return {
    planningAllowed,
    goal: serializeGoal(goal),
    stories: stories.map(serializeStory),
    insights: insights.map((i) => serializeInsight(i)),
    companion: {
      planAllowed: companionAllowed,
      windowOpen: win.available,
      usedToday,
      dayNumber: win.dayNumber,
      totalDays: win.totalDays,
      reason: win.reason,
    },
    reminder: reminder
      ? {
          enabled: reminder.enabled,
          times: reminder.times ? reminder.times.split(",").filter(Boolean) : [],
          channel: isReminderChannel(reminder.channel) ? reminder.channel : "inapp",
          customMessage: reminder.customMessage,
        }
      : { enabled: false, times: [], channel: "inapp", customMessage: null },
  };
}
