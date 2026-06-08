// ─────────────────────────────────────────────────────────────────────────────
// /api/reports/weekly — v3 (DECISION-047)
//
// GET  ?weekStart=<ISO>  — گزارش هفته با weekStart مشخص. بدون پارامتر = هفته گذشته.
// POST  body: { weekStart?: <ISO> }  — تولید گزارش (اگر وجود نداشت)
//
// تغییر v3: ورودی AI با اسکلت کامل ۷ روز + گپ‌ها + سیگنال ۴ هفته غنی شد؛ همهٔ
// متریک‌ها در کد قطعی محاسبه می‌شوند (نه AI). AI فقط روایت/خوشه‌بندی/بینش می‌دهد.
//
// maxDuration = 90s — فراخوانی GapGPT ممکن است ۳۰-۶۰ ثانیه طول بکشد
// ─────────────────────────────────────────────────────────────────────────────

export const maxDuration = 90;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import {
  formatJalali,
  formatWeekday,
  getJalaaliWeekRange,
  getLastCompletedWeekRange,
  type JalaliWeekRange,
} from "@/lib/utils/date";
import { invokeAI } from "@/lib/ai/orchestrator";
import { planAllows } from "@/lib/plans/access";
import { getEffectivePlanKey } from "@/lib/plans/effective";
import { getCountryFromHeaders } from "@/lib/utils/geo";
import {
  buildWeekSkeleton,
  computeMetrics,
  buildGapInputs,
  computeHistory,
  expandCategories,
  type RawEntry,
  type RawGap,
} from "@/lib/reports/weekly-analysis";
import type {
  WeeklyReportInput,
  WeeklyReportOutput,
  WeeklyEntryItem,
} from "@/lib/ai/roles/weekly-report/schema";
import type {
  WeeklyReflectionInput,
  WeeklyReflectionOutput,
} from "@/lib/ai/roles/weekly-reflection/schema";
import type { SerializedWeeklyReport, WeeklyReportContent } from "@/types/weekly-report";
import { IS_DEV_MODE } from "@/lib/env";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const HISTORY_WEEKS = 4;

// ─────────────────────────────────────────────────────────────────────────────
// GET — fetch existing report (یا null)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("weekStart");

  const range = weekStartParam
    ? resolveRangeFromParam(weekStartParam)
    : getLastCompletedWeekRange();

  if (!range) {
    return NextResponse.json({ ok: false, error: "invalid_week_start" }, { status: 400 });
  }

  const existing = await prisma.weeklyReport.findUnique({
    where: { userId_weekStart: { userId: user.userId, weekStart: range.weekStart } },
  });

  return NextResponse.json({
    ok: true,
    range: {
      weekStart: range.weekStart.toISOString(),
      weekEnd: range.weekEnd.toISOString(),
      jalaliStart: range.jalaliStart,
      jalaliEnd: range.jalaliEnd,
    },
    report: existing ? serializeReport(existing, range) : null,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — generate (or return existing)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { weekStart?: unknown } = {};
  try {
    if (request.headers.get("content-length") !== "0") {
      body = (await request.json()) as { weekStart?: unknown };
    }
  } catch {
    // body اختیاری
  }

  const range =
    typeof body.weekStart === "string"
      ? resolveRangeFromParam(body.weekStart)
      : getLastCompletedWeekRange();

  if (!range) {
    return NextResponse.json({ ok: false, error: "invalid_week_start" }, { status: 400 });
  }

  // idempotent — اگر از قبل ساخته شده، همان را بده
  const existing = await prisma.weeklyReport.findUnique({
    where: { userId_weekStart: { userId: user.userId, weekStart: range.weekStart } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, created: false, report: serializeReport(existing, range) });
  }

  // پلن کاربر — دسترسی به تأمل (نقش weekly-reflection). پلنِ مؤثر (با انقضا، DECISION-062)
  const userPlan = await getEffectivePlanKey(user.userId);
  const includeCoaching = await planAllows(userPlan, "weekly.reflection");

  // ① تعهدهای هفته
  const entries = (await prisma.dailyEntry.findMany({
    where: { userId: user.userId, date: { gte: range.weekStart, lte: range.weekEnd } },
    include: { feedback: true },
    orderBy: { date: "asc" },
  })) as RawEntry[];

  // ② گپ‌های همپوشان با هفته
  const gaps = (await prisma.gapRecord.findMany({
    where: {
      userId: user.userId,
      fromDate: { lte: range.weekEnd },
      toDate: { gte: range.weekStart },
    },
    orderBy: { fromDate: "asc" },
  })) as RawGap[];

  // ③ دادهٔ تاریخی ۴ هفتهٔ گذشته (قبل از این هفته)
  const historyStart = new Date(range.weekStart.getTime() - HISTORY_WEEKS * 7 * MS_PER_DAY);
  const [pastEntriesRaw, pastGapsRaw] = await Promise.all([
    prisma.dailyEntry.findMany({
      where: { userId: user.userId, date: { gte: historyStart, lt: range.weekStart } },
      select: { date: true, feedback: { select: { status: true } } },
    }),
    prisma.gapRecord.findMany({
      where: { userId: user.userId, fromDate: { lt: range.weekStart }, toDate: { gte: historyStart } },
      select: { fromDate: true, toDate: true },
    }),
  ]);

  // ── محاسبات قطعی ──
  const { days, strip } = buildWeekSkeleton(range.weekStart, entries, gaps);
  const metrics = computeMetrics(days);
  const gapInputs = buildGapInputs(gaps);
  const history = computeHistory(
    pastEntriesRaw.map((e) => ({ date: e.date, status: e.feedback?.status ?? null })),
    pastGapsRaw,
    metrics.activeDays
  );

  // entries نگاشت‌شده برای AI (ترتیب = ترتیب findMany → entryRefs منطبق)
  const mappedEntries: WeeklyEntryItem[] = entries.map((e) => ({
    date: e.date.toISOString(),
    jalaliDate: formatJalali(e.date),
    weekday: formatWeekday(e.date),
    content: e.content,
    feedbackStatus: e.feedback ? (e.feedback.status as "DONE" | "NOT_DONE") : null,
    feedbackNote: e.feedback?.note ?? null,
  }));

  const reportInput: WeeklyReportInput = {
    userId: user.userId,
    weekStart: range.weekStart.toISOString(),
    weekEnd: range.weekEnd.toISOString(),
    jalaliWeekStart: range.jalaliStart,
    jalaliWeekEnd: range.jalaliEnd,
    entries: mappedEntries,
    days,
    gaps: gapInputs,
    history,
    includeCoaching: false,
  };

  const clientCountry = getCountryFromHeaders(request.headers);
  const aiCtx = { userId: user.userId, locale: "fa" as const, clientCountry };

  // تأمل (موازی، فقط Plus/Pro) — خطایش گزارش را نمی‌شکند
  const reflectionPromise: Promise<string | null> = includeCoaching
    ? invokeAI<WeeklyReflectionInput, WeeklyReflectionOutput>(
        "weekly-reflection",
        {
          jalaliWeekStart: range.jalaliStart,
          jalaliWeekEnd: range.jalaliEnd,
          entries: mappedEntries,
          days,
          gaps: gapInputs,
          history,
        },
        aiCtx
      )
        .then((r) => r.output.reflection)
        .catch((err) => {
          console.error("[weekly-reflection] ناموفق — گزارش بدون تأمل ادامه می‌یابد:", err);
          return null;
        })
    : Promise.resolve(null);

  let aiResult;
  try {
    aiResult = await invokeAI<WeeklyReportInput, WeeklyReportOutput>("weekly-report", reportInput, aiCtx);
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطای نامشخص";
    return NextResponse.json(
      {
        ok: false,
        error: "ai_failed",
        message: "تولید گزارش با خطا مواجه شد",
        ...(IS_DEV_MODE ? { devError: message } : {}),
      },
      { status: 500 }
    );
  }

  const reflectionText = await reflectionPromise;

  // بسط دسته‌های AI به شمارش قطعی + ساخت محتوای نهایی
  const categories = expandCategories(aiResult.output.categories, mappedEntries);

  const content: WeeklyReportContent = {
    summary: aiResult.output.summary,
    insights: aiResult.output.insights,
    categories,
    reflection: reflectionText,
    metrics,
    dayStrip: strip,
  };

  const created = await prisma.weeklyReport.create({
    data: {
      userId: user.userId,
      weekStart: range.weekStart,
      weekEnd: range.weekEnd,
      aiContent: JSON.stringify({ content, meta: aiResult.meta }),
    },
  });

  return NextResponse.json(
    { ok: true, created: true, report: serializeReport(created, range) },
    { status: 201 }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function resolveRangeFromParam(weekStartParam: string): JalaliWeekRange | null {
  const date = new Date(weekStartParam);
  if (Number.isNaN(date.getTime())) return null;
  return getJalaaliWeekRange(date);
}

interface StoredReportRow {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  aiContent: string;
  generatedAt: Date;
  isShared: boolean;
}

interface StoredContent {
  content: WeeklyReportContent;
  meta: SerializedWeeklyReport["meta"];
}

function serializeReport(report: StoredReportRow, range: JalaliWeekRange): SerializedWeeklyReport {
  const parsed = JSON.parse(report.aiContent) as StoredContent;
  return {
    id: report.id,
    weekStart: report.weekStart.toISOString(),
    weekEnd: report.weekEnd.toISOString(),
    jalaliStart: range.jalaliStart,
    jalaliEnd: range.jalaliEnd,
    generatedAt: report.generatedAt.toISOString(),
    content: parsed.content,
    meta: parsed.meta,
    isShared: report.isShared,
  };
}
