// ─────────────────────────────────────────────────────────────────────────────
// goal/storyboard.ts — ساختِ «اسلاتِ روزها»ی استوری‌بورد (DECISION-082)
// pure + client-safe (فقط formatهای date.ts). از نمای هدف، فهرستِ روزها را می‌سازد:
// از شروع تا «امروز» (نه آینده)، با گروه‌بندیِ استوری‌ها و بینشِ همراهِ هر روز.
// ─────────────────────────────────────────────────────────────────────────────

import { formatJalaliFromISO, formatWeekday } from "@/lib/utils/date";
import type { SerializedInsight, SerializedStory, GoalMood } from "@/types/goal";

export const MOOD_LABELS: Record<GoalMood, string> = {
  good: "خوب",
  neutral: "معمولی",
  hard: "سخت",
};

export interface DaySlot {
  iso: string;
  dayNumber: number;
  dayLabel: string; // شمسی
  weekdayLabel: string;
  isToday: boolean;
  stories: SerializedStory[];
  insight: SerializedInsight | null;
}

/** گرهِ «ریلِ سفر» — مثل DaySlot ولی روزهای آینده را هم شامل می‌شود (isFuture). */
export interface JourneyNode extends DaySlot {
  isFuture: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isoToUtc(iso: string): number {
  return new Date(`${iso}T00:00:00.000Z`).getTime();
}

function utcToIso(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function weekdayFromIso(iso: string): string {
  return formatWeekday(new Date(`${iso}T00:00:00.000Z`));
}

/**
 * اسلاتِ روزها از «امروز» (جدیدترین) تا «شروع» (قدیمی‌ترین) — مناسبِ استوری‌بوردِ
 * RTL که جدیدترین در سمتِ راست دیده می‌شود. روزهای آینده نمایش داده نمی‌شوند.
 */
export function buildDaySlots(
  startIso: string,
  endIso: string,
  todayIso: string,
  stories: SerializedStory[],
  insights: SerializedInsight[]
): DaySlot[] {
  const startMs = isoToUtc(startIso);
  const todayMs = isoToUtc(todayIso);
  const endMs = isoToUtc(endIso);
  // سقفِ نمایش = کمینهٔ امروز و پایان (اگر امروز بعد از پایان بود)
  const lastMs = Math.min(todayMs, endMs);
  if (lastMs < startMs) return [];

  const storiesByIso = new Map<string, SerializedStory[]>();
  for (const s of stories) {
    const arr = storiesByIso.get(s.dateIso) ?? [];
    arr.push(s);
    storiesByIso.set(s.dateIso, arr);
  }
  const insightByIso = new Map<string, SerializedInsight>();
  for (const i of insights) {
    // dayKey == iso روزِ بینش
    if (!insightByIso.has(i.dayKey)) insightByIso.set(i.dayKey, i);
  }

  const slots: DaySlot[] = [];
  for (let ms = lastMs; ms >= startMs; ms -= MS_PER_DAY) {
    const iso = utcToIso(ms);
    const dayNumber = Math.round((ms - startMs) / MS_PER_DAY) + 1;
    slots.push({
      iso,
      dayNumber,
      dayLabel: formatJalaliFromISO(iso),
      weekdayLabel: weekdayFromIso(iso),
      isToday: ms === todayMs,
      stories: storiesByIso.get(iso) ?? [],
      insight: insightByIso.get(iso) ?? null,
    });
  }
  return slots;
}

/**
 * گره‌های «ریلِ سفر» از روزِ شروع تا روزِ پایان (همهٔ روزها، شاملِ آینده) — ترتیبِ
 * زمانی (روز ۱ ابتدا). روزهای بعد از امروز با isFuture=true (هنوز نرسیده) علامت می‌خورند.
 * مناسبِ JourneyRail که کلِ مسیر را نشان می‌دهد. منبعِ استوری/بینش مثل buildDaySlots.
 */
export function buildJourneyNodes(
  startIso: string,
  endIso: string,
  todayIso: string,
  stories: SerializedStory[],
  insights: SerializedInsight[]
): JourneyNode[] {
  const startMs = isoToUtc(startIso);
  const endMs = isoToUtc(endIso);
  const todayMs = isoToUtc(todayIso);
  if (endMs < startMs) return [];

  const storiesByIso = new Map<string, SerializedStory[]>();
  for (const s of stories) {
    const arr = storiesByIso.get(s.dateIso) ?? [];
    arr.push(s);
    storiesByIso.set(s.dateIso, arr);
  }
  const insightByIso = new Map<string, SerializedInsight>();
  for (const i of insights) {
    if (!insightByIso.has(i.dayKey)) insightByIso.set(i.dayKey, i);
  }

  const nodes: JourneyNode[] = [];
  for (let ms = startMs; ms <= endMs; ms += MS_PER_DAY) {
    const iso = utcToIso(ms);
    const dayNumber = Math.round((ms - startMs) / MS_PER_DAY) + 1;
    nodes.push({
      iso,
      dayNumber,
      dayLabel: formatJalaliFromISO(iso),
      weekdayLabel: weekdayFromIso(iso),
      isToday: ms === todayMs,
      isFuture: ms > todayMs,
      stories: storiesByIso.get(iso) ?? [],
      insight: insightByIso.get(iso) ?? null,
    });
  }
  return nodes;
}
