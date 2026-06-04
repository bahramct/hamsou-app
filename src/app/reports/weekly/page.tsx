// ─────────────────────────────────────────────────────────────────────────────
// /reports/weekly — لیست گزارش‌های هفتگی
//
// Server Component — مستقیماً DB می‌خواند، بدون API call داخلی
//
// ساختار صفحه:
//   ① کارت هفته جاری (همیشه بالا — غیرفعال)
//   ② لیست هفته‌های گذشته (۴ در صفحه) — گزارش‌دار یا خالی
//   ③ Pagination با query param ?page=N
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import {
  getCurrentWeekRange,
  getJalaaliWeekRange,
  getTodayDateForDB,
  type JalaliWeekRange,
} from "@/lib/utils/date";
import { WeeklyReportCard } from "@/components/features/reports/WeeklyReportCard";
import { GenerateReportButton } from "@/components/features/reports/GenerateReportButton";
import type { SerializedWeeklyReport, WeeklyReportContent } from "@/types/weekly-report";

const PER_PAGE = 4;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

// ─── Shape داده برای هر week slot ────────────────────────────────────────────
interface WeekSlot {
  weekStart: string;
  weekEnd: string;
  jalaliStart: string;
  jalaliEnd: string;
  entryCount: number;
  report: SerializedWeeklyReport | null;
}

// ─── Row خام از Prisma ────────────────────────────────────────────────────────
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

function serializeReport(
  row: StoredReportRow,
  range: JalaliWeekRange
): SerializedWeeklyReport {
  const parsed = JSON.parse(row.aiContent) as StoredContent;
  return {
    id: row.id,
    weekStart: row.weekStart.toISOString(),
    weekEnd: row.weekEnd.toISOString(),
    jalaliStart: range.jalaliStart,
    jalaliEnd: range.jalaliEnd,
    generatedAt: row.generatedAt.toISOString(),
    content: parsed.content,
    meta: parsed.meta,
    isShared: row.isShared,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function WeeklyReportPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const pageParam = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  // پلن کاربر برای plan gate تب تأمل
  const fullUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { plan: true, planPaidSince: true },
  });
  const userPlan = fullUser?.plan ?? "FREE";
  const planPaidSince = fullUser?.planPaidSince?.toISOString() ?? null;

  const currentWeek = getCurrentWeekRange();
  const todayForDB = getTodayDateForDB();

  // روزهای باقی‌مانده هفته جاری (شامل امروز)
  const daysRemaining =
    Math.round(
      (currentWeek.weekEnd.getTime() - todayForDB.getTime()) / MS_PER_DAY
    ) + 1;

  // تعداد تعهدهای هفته جاری (برای نمایش در کارت غیرفعال)
  const currentWeekEntryCount = await prisma.dailyEntry.count({
    where: {
      userId: user.userId,
      date: { gte: currentWeek.weekStart, lte: currentWeek.weekEnd },
    },
  });

  // تاریخ همه تعهدهای گذشته (قبل از هفته جاری)
  const pastEntryDates = await prisma.dailyEntry.findMany({
    where: {
      userId: user.userId,
      date: { lt: currentWeek.weekStart },
    },
    select: { date: true },
    orderBy: { date: "asc" },
  });

  // همه گزارش‌های گذشته
  const pastReports = await prisma.weeklyReport.findMany({
    where: {
      userId: user.userId,
      weekStart: { lt: currentWeek.weekStart },
    },
  });

  // گروه‌بندی تعهدها بر اساس هفته
  const weekEntryMap = new Map<
    string,
    { range: JalaliWeekRange; count: number }
  >();
  for (const { date } of pastEntryDates) {
    const range = getJalaaliWeekRange(date);
    const key = range.weekStart.toISOString();
    if (!weekEntryMap.has(key)) {
      weekEntryMap.set(key, { range, count: 0 });
    }
    weekEntryMap.get(key)!.count++;
  }

  // نقشه گزارش‌ها بر اساس weekStart
  const reportMap = new Map<string, StoredReportRow>();
  for (const r of pastReports) {
    reportMap.set(r.weekStart.toISOString(), r);
  }

  // ترکیب کلیدها — هفته‌هایی که تعهد دارند (گزارش داشته باشند یا نه)
  const allSlots: WeekSlot[] = Array.from(weekEntryMap.entries())
    .sort(([a], [b]) => (a > b ? -1 : 1)) // جدیدترین اول
    .map(([key, { range, count }]) => {
      const row = reportMap.get(key);
      return {
        weekStart: range.weekStart.toISOString(),
        weekEnd: range.weekEnd.toISOString(),
        jalaliStart: range.jalaliStart,
        jalaliEnd: range.jalaliEnd,
        entryCount: count,
        report: row ? serializeReport(row, range) : null,
      };
    });

  // Pagination
  const total = allSlots.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(pageParam, totalPages);
  const pageSlots = allSlots.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  );

  return (
    <AppShell>
      {/* محتوا */}
      <div className="flex-1 max-w-xl mx-auto w-full px-5 py-8 sm:py-12 space-y-4 animate-fade-up">
        {/* عنوان صفحه */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">گزارش‌های هفتگی</h1>
          <p className="text-xs text-fog mt-1">
            هر هفته یک نگاه به مسیر طی‌شده
          </p>
        </div>

        {/* ① کارت هفته جاری — همیشه نمایش داده می‌شود */}
        <CurrentWeekCard
          jalaliStart={currentWeek.jalaliStart}
          jalaliEnd={currentWeek.jalaliEnd}
          daysRemaining={daysRemaining}
          entryCount={currentWeekEntryCount}
        />

        {/* ② هفته‌های گذشته */}
        {total === 0 ? (
          <EmptyState />
        ) : (
          <>
            {pageSlots.map((slot) =>
              slot.report ? (
                <WeeklyReportCard key={slot.weekStart} report={slot.report} userPlan={userPlan} planPaidSince={planPaidSince} />
              ) : (
                <GhostCard key={slot.weekStart} slot={slot} />
              )
            )}

            {/* ③ Pagination */}
            {totalPages > 1 && (
              <PaginationBar page={safePage} totalPages={totalPages} />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

// ─── کارت هفته جاری (غیرفعال) ────────────────────────────────────────────────
function CurrentWeekCard({
  jalaliStart,
  jalaliEnd,
  daysRemaining,
  entryCount,
}: {
  jalaliStart: string;
  jalaliEnd: string;
  daysRemaining: number;
  entryCount: number;
}) {
  const days = daysRemaining.toLocaleString("fa-IR");
  const elapsed = 7 - daysRemaining;
  const fillPct = elapsed > 0 ? Math.min(100, (entryCount / elapsed) * 100) : 0;

  return (
    <div className="rounded-2xl border border-black/6 bg-white/40 backdrop-blur-sm p-5 space-y-4 shadow-paper-sm animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-fog tracking-widest uppercase mb-1">
            هفته جاری
          </p>
          <p className="text-sm font-medium text-stone fa-num">
            {jalaliStart}
            <span className="mx-2 text-fog text-xs">←</span>
            {jalaliEnd}
          </p>
        </div>
        <span className="shrink-0 text-[11px] bg-fog/15 text-fog px-2.5 py-1 rounded-full fa-num">
          {days} روز مانده
        </span>
      </div>

      {/* نوار پیشرفت هفته */}
      {elapsed > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-fog/80 fa-num">
              {entryCount > 0
                ? `${entryCount.toLocaleString("fa-IR")} تعهد از ${elapsed.toLocaleString("fa-IR")} روز گذشته`
                : `${elapsed.toLocaleString("fa-IR")} روز گذشته — هنوز تعهدی ندارند`}
            </span>
          </div>
          <div className="h-1 rounded-full bg-black/6 overflow-hidden">
            <div
              className="h-full rounded-full bg-sage/50 transition-[width] duration-700 ease-out"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-fog/70 leading-relaxed">
        گزارش این هفته پس از پایان جمعه قابل ساختن است.
      </p>
    </div>
  );
}

// ─── کارت خاکستری (هفته بدون گزارش) ─────────────────────────────────────────
function GhostCard({ slot }: { slot: WeekSlot }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white/25 backdrop-blur-sm px-5 py-4 shadow-paper-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] text-fog tracking-widest uppercase mb-1">
            گزارش هفته
          </p>
          <p className="text-sm font-medium text-stone/65 fa-num truncate">
            {slot.jalaliStart}
            <span className="mx-2 text-fog text-xs">←</span>
            {slot.jalaliEnd}
          </p>
          {slot.entryCount > 0 && (
            <p className="text-[10px] text-fog/60 mt-1 fa-num">
              {slot.entryCount.toLocaleString("fa-IR")} تعهد
            </p>
          )}
        </div>
        <div className="shrink-0">
          <GenerateReportButton
            weekStartIso={slot.weekStart}
            totalEntries={slot.entryCount}
          />
        </div>
      </div>
    </div>
  );
}

// ─── حالت خالی (هنوز هیچ هفته گذشته‌ای نیست) ─────────────────────────────────
function EmptyState() {
  return (
    <div className="text-center py-12 space-y-2">
      <p className="text-sm text-stone">
        هنوز هفته‌ای برای گزارش وجود ندارد.
      </p>
      <p className="text-xs text-fog">
        پس از گذشتن اولین هفته، گزارش اینجا ظاهر می‌شود.
      </p>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function PaginationBar({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const current = page.toLocaleString("fa-IR");
  const total = totalPages.toLocaleString("fa-IR");

  return (
    <div className="flex items-center justify-center gap-4 pt-2 pb-4">
      {page > 1 ? (
        <Link
          href={`/reports/weekly?page=${page - 1}`}
          className="text-sm text-stone hover:text-ink transition-colors"
        >
          → قبلی
        </Link>
      ) : (
        <span className="text-sm text-fog/40 cursor-default">→ قبلی</span>
      )}

      <span className="text-xs text-fog fa-num">
        {current} از {total}
      </span>

      {page < totalPages ? (
        <Link
          href={`/reports/weekly?page=${page + 1}`}
          className="text-sm text-stone hover:text-ink transition-colors"
        >
          بعدی ←
        </Link>
      ) : (
        <span className="text-sm text-fog/40 cursor-default">بعدی ←</span>
      )}
    </div>
  );
}
