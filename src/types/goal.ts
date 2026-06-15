// ─────────────────────────────────────────────────────────────────────────────
// types/goal.ts — تایپ‌های سریالایزِ فیچر «برنامه‌ریزی» (DECISION-082)
// مبادله بین Server Components/Routes و Client Components (Date → string).
// ─────────────────────────────────────────────────────────────────────────────

export type GoalMood = "good" | "neutral" | "hard";
export type ReminderChannel = "inapp" | "email" | "both";
export type GoalType = "goal" | "challenge"; // هدف | چالش (TASK-28 فاز ۲)

export interface SerializedGoal {
  id: string;
  title: string;
  type: GoalType; // هدف یا چالش — تفاوتِ لحن/بَج، نه ساختار
  startIso: string; // "YYYY-MM-DD" میلادی (مبادله)
  endIso: string;
  startLabel: string; // شمسی
  endLabel: string;
  status: string; // active | completed | abandoned
  totalDays: number;
  dayNumber: number; // روزِ جاری از مسیر
  daysRemaining: number;
}

export interface SerializedStory {
  id: string;
  dateIso: string;
  dateLabel: string; // شمسی
  weekdayLabel: string;
  content: string;
  mood: GoalMood | null;
  createdAtIso: string;
}

export interface SerializedInsight {
  id: string;
  dayKey: string;
  dayNumber: number;
  dateLabel: string;
  reflection: string;
  observations: string[];
  suggestions: string[];
  generatedAtIso: string;
}

export interface GoalCompanionState {
  planAllowed: boolean; // امکانِ پلن goal.companion
  windowOpen: boolean; // روزِ ۳ تا قبل از پایان
  usedToday: boolean; // امروز یک‌بار مصرف شده
  dayNumber: number;
  totalDays: number;
  reason?: "before_day_2" | "ended" | "last_day";
}

export interface GoalReminderConfig {
  enabled: boolean;
  times: string[]; // "HH:mm"
  channel: ReminderChannel;
  customMessage: string | null;
}

export interface ActiveGoalView {
  planningAllowed: boolean; // امکانِ پلن goal.planning
  goal: SerializedGoal | null;
  stories: SerializedStory[];
  insights: SerializedInsight[];
  companion: GoalCompanionState;
  reminder: GoalReminderConfig;
}

// ─── کتابخانهٔ مسیرها + بازخوانیِ سفر (TASK-28 فاز ۳) ─────────────────────────

/** کارتِ یک مسیرِ گذشته (completed|abandoned) در «کتابخانهٔ مسیرها». */
export interface SerializedJourneyCard {
  id: string;
  type: GoalType;
  title: string;
  status: string; // completed | abandoned
  startLabel: string; // شمسی
  endLabel: string;
  totalDays: number;
  storyCount: number;
  insightCount: number;
  essence: string | null; // نمایندهٔ مسیر — اولین استوری
}

/** یک روزِ بافته‌شده در «بازخوانیِ سفر» (استوری + بینشِ همراه). */
export interface JourneyRecapDay {
  dayNumber: number;
  dateLabel: string; // شمسی
  weekdayLabel: string;
  story: { content: string; mood: GoalMood | null } | null;
  insight: { reflection: string; suggestions: string[] } | null;
}

/** نمای کاملِ «بازخوانیِ سفر» (lazy از /api/goal/[id]/recap). */
export interface JourneyRecap {
  id: string;
  type: GoalType;
  title: string;
  status: string;
  startLabel: string;
  endLabel: string;
  totalDays: number;
  storyCount: number;
  insightCount: number;
  days: JourneyRecapDay[];
}
