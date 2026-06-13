// ─────────────────────────────────────────────────────────────────────────────
// تحلیل قطعیِ هفته (DECISION-047) — همهٔ اعداد اینجا محاسبه می‌شوند، نه در AI.
//
// چرا: باگِ «۱۰۰٪» از این می‌آمد که AI خودش completionRate را حساب می‌کرد و
// روزهای خالی/گپ را نادیده می‌گرفت. حالا کد، کلِ ۷ روز را قطعی می‌شمارد و AI
// فقط روایت/خوشه‌بندی/بینش می‌دهد.
// ─────────────────────────────────────────────────────────────────────────────

import { formatJalali, formatWeekday, getJalaaliWeekRange } from "@/lib/utils/date";
import type {
  WeeklyDayInput,
  WeeklyGapInput,
  WeeklyHistoryInput,
  AICategory,
  WeeklyEntryItem,
} from "@/lib/ai/roles/weekly-report/schema";
import type {
  WeeklyDayCell,
  WeeklyMetrics,
  WeeklyCategory,
} from "@/types/weekly-report";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ─── ورودی‌های خام (از Prisma) ────────────────────────────────────────────────

export interface RawEntry {
  date: Date;
  content: string;
  feedback: { status: string; note: string | null } | null;
}

export interface RawGap {
  fromDate: Date;
  toDate: Date;
  note: string | null;
}

/** فریز پیشگیرانه (type="freeze") */
export interface RawFreeze {
  fromDate: Date;
  toDate: Date;
  note: string | null;
}

// ─── اسکلت ۷ روز هفته ─────────────────────────────────────────────────────────

/** آیا این روز در بازهٔ یک گپ ثبت‌شده است؟ (مقایسه با نیمروز برای مقاومت به offset) */
function gapNoteForDay(dayStartMs: number, gaps: RawGap[]): string | null | undefined {
  const mid = dayStartMs + MS_PER_DAY / 2;
  for (const g of gaps) {
    if (mid >= g.fromDate.getTime() && mid <= g.toDate.getTime() + MS_PER_DAY) {
      return g.note; // undefined یعنی «گپ نیست» — null هم یک گپِ بی‌توضیح است
    }
  }
  return undefined;
}

/** آیا این روز در بازهٔ یک فریز پیشگیرانه است؟ */
function isFreezeDay(dayStartMs: number, freezes: RawFreeze[]): boolean {
  const mid = dayStartMs + MS_PER_DAY / 2;
  for (const f of freezes) {
    if (mid >= f.fromDate.getTime() && mid <= f.toDate.getTime() + MS_PER_DAY) {
      return true;
    }
  }
  return false;
}

export interface WeekSkeleton {
  days: WeeklyDayInput[];
  strip: WeeklyDayCell[];
}

export function buildWeekSkeleton(
  weekStart: Date,
  entries: RawEntry[],
  gaps: RawGap[],
  freezes: RawFreeze[] = []
): WeekSkeleton {
  // نگاشت تعهدها بر اساس کلید روزِ جلالی (یکتا per روز)
  const entryByDay = new Map<string, RawEntry>();
  for (const e of entries) entryByDay.set(formatJalali(e.date), e);

  const days: WeeklyDayInput[] = [];
  const strip: WeeklyDayCell[] = [];

  for (let i = 0; i < 7; i++) {
    const dayMs = weekStart.getTime() + i * MS_PER_DAY;
    const dayDate = new Date(dayMs);
    const jalaliDate = formatJalali(dayDate);
    const weekday = formatWeekday(dayDate);

    const entry = entryByDay.get(jalaliDate);
    let state: WeeklyDayInput["state"];
    let content: string | null = null;
    let note: string | null = null;

    if (entry) {
      content = entry.content;
      note = entry.feedback?.note ?? null;
      state = entry.feedback
        ? entry.feedback.status === "DONE"
          ? "done"
          : "not_done"
        : "pending";
    } else if (isFreezeDay(dayMs, freezes)) {
      state = "freeze";
    } else {
      const gapNote = gapNoteForDay(dayMs, gaps);
      if (gapNote !== undefined) {
        state = "gap";
        note = gapNote;
      } else {
        state = "empty";
      }
    }

    days.push({ jalaliDate, weekday, state, content, note });
    strip.push({ jalaliDate, weekday, state });
  }

  return { days, strip };
}

// ─── متریک‌های قطعی ───────────────────────────────────────────────────────────

export function computeMetrics(days: WeeklyDayInput[]): WeeklyMetrics {
  const count = (s: WeeklyDayInput["state"]) => days.filter((d) => d.state === s).length;
  const doneCount = count("done");
  const notDoneCount = count("not_done");
  const pendingCount = count("pending");
  const gapDays = count("gap");
  const freezeDays = count("freeze");
  const emptyDays = count("empty");
  const activeDays = doneCount + notDoneCount + pendingCount;
  const committed = doneCount + notDoneCount;
  const doneOfCommitted = committed > 0 ? Math.round((doneCount / committed) * 100) : 0;

  return {
    totalDays: 7,
    activeDays,
    doneCount,
    notDoneCount,
    pendingCount,
    gapDays,
    freezeDays,
    emptyDays,
    doneOfCommitted,
  };
}

// ─── گپ‌های صریح برای ورودی AI ────────────────────────────────────────────────

export function buildGapInputs(gaps: RawGap[]): WeeklyGapInput[] {
  return gaps.map((g) => {
    const days = Math.max(1, Math.round((g.toDate.getTime() - g.fromDate.getTime()) / MS_PER_DAY) + 1);
    return {
      fromJalali: formatJalali(g.fromDate),
      toJalali: formatJalali(g.toDate),
      days,
      note: g.note,
    };
  });
}

// ─── سیگنال تاریخی ۴ هفته ─────────────────────────────────────────────────────

interface WeekAgg {
  active: number;
  done: number;
  notdone: number;
  hasGap: boolean;
}

export function computeHistory(
  pastEntries: { date: Date; status: string | null }[],
  pastGaps: { fromDate: Date; toDate: Date }[],
  currentActiveDays: number
): WeeklyHistoryInput | null {
  const weeks = new Map<string, WeekAgg>();
  const touch = (key: string): WeekAgg => {
    let w = weeks.get(key);
    if (!w) {
      w = { active: 0, done: 0, notdone: 0, hasGap: false };
      weeks.set(key, w);
    }
    return w;
  };

  for (const e of pastEntries) {
    const key = getJalaaliWeekRange(e.date).weekStart.toISOString();
    const w = touch(key);
    w.active++;
    if (e.status === "DONE") w.done++;
    else if (e.status === "NOT_DONE") w.notdone++;
  }

  for (const g of pastGaps) {
    touch(getJalaaliWeekRange(g.fromDate).weekStart.toISOString()).hasGap = true;
    const k2 = getJalaaliWeekRange(g.toDate).weekStart.toISOString();
    touch(k2).hasGap = true;
  }

  const list = [...weeks.values()];
  const weeksConsidered = list.length;
  if (weeksConsidered === 0) return null;

  const avgActiveDays = Math.round(list.reduce((s, w) => s + w.active, 0) / weeksConsidered);

  const rated = list.filter((w) => w.done + w.notdone > 0);
  const avgDoneRate = rated.length
    ? Math.round(rated.reduce((s, w) => s + (w.done / (w.done + w.notdone)) * 100, 0) / rated.length)
    : 0;

  const gapWeeks = list.filter((w) => w.hasGap).length;

  let trend: WeeklyHistoryInput["trend"] = "unknown";
  if (avgActiveDays > 0) {
    if (currentActiveDays > avgActiveDays * 1.2) trend = "rising";
    else if (currentActiveDays < avgActiveDays * 0.8) trend = "declining";
    else trend = "steady";
  }

  return { weeksConsidered, avgActiveDays, avgDoneRate, gapWeeks, trend };
}

// ─── بسط دسته‌های AI به شمارش قطعی ────────────────────────────────────────────

/** entryRefs (۱-based) از AI → شمارش done/notDone قطعی از روی feedbackStatus واقعی. */
export function expandCategories(
  aiCategories: AICategory[],
  entries: WeeklyEntryItem[]
): WeeklyCategory[] {
  const out: WeeklyCategory[] = [];
  for (const c of aiCategories) {
    let doneCount = 0;
    let notDoneCount = 0;
    let total = 0;
    const seen = new Set<number>();
    for (const ref of c.entryRefs) {
      const idx = ref - 1;
      if (idx < 0 || idx >= entries.length || seen.has(idx)) continue;
      seen.add(idx);
      total++;
      const st = entries[idx].feedbackStatus;
      if (st === "DONE") doneCount++;
      else if (st === "NOT_DONE") notDoneCount++;
    }
    if (total > 0) out.push({ label: c.label, doneCount, notDoneCount, total, dimension: c.dimension });
  }
  return out;
}
