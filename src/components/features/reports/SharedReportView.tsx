"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SharedReportView — نمای عمومیِ اشتراک‌گذاری‌شده (DECISION-052)
//
// یک اسکرول بدون tab: هدر → متریک‌ها → نوار هفته → خلاصه → دسته‌بندی
// → نکات → تأمل + نمودارها (اگر موجود).
// داده از page.tsx (Server) به‌صورت SerializedWeeklyReport می‌رسد.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type {
  SerializedWeeklyReport,
  WeeklyReportContent,
  WeeklyMetrics,
  WeeklyCategory,
  WeeklyDayCell,
  DayState,
} from "@/types/weekly-report";
import { WeekDonut, CategoryChart } from "@/components/features/reports/ReflectionCharts";

// ── نرمال‌سازی (سازگاری با گزارش‌های قدیمی v1/v2) ────────────────────────────

interface ReportView {
  summary: string;
  metrics: WeeklyMetrics;
  dayStrip: WeeklyDayCell[];
  categories: WeeklyCategory[];
  insights: { text: string }[];
  reflection: string | null;
}

function normalize(c: WeeklyReportContent): ReportView {
  const metrics: WeeklyMetrics =
    c.metrics ??
    (() => {
      const done = c.doneCount ?? 0;
      const notDone = c.notDoneCount ?? 0;
      const pending = c.pendingCount ?? 0;
      const active = c.totalEntries ?? done + notDone + pending;
      return {
        totalDays: 7,
        activeDays: active,
        doneCount: done,
        notDoneCount: notDone,
        pendingCount: pending,
        gapDays: 0,
        freezeDays: 0,
        emptyDays: Math.max(0, 7 - active),
        doneOfCommitted: c.completionRate ?? 0,
      };
    })();

  const categories: WeeklyCategory[] = (c.categories ?? []).map((cat) => ({
    label: cat.label,
    doneCount: cat.doneCount,
    notDoneCount: cat.notDoneCount,
    total: cat.total ?? cat.doneCount + cat.notDoneCount,
    dimension: cat.dimension,
  }));

  const insights =
    c.insights && c.insights.length > 0
      ? c.insights
      : (c.highlights ?? []).map((text) => ({ text }));

  return {
    summary: c.summary,
    metrics,
    dayStrip: c.dayStrip ?? [],
    categories,
    insights,
    reflection: c.reflection,
  };
}

// ── کامپوننت اصلی ──────────────────────────────────────────────────────────────

interface Props {
  report: SerializedWeeklyReport;
  displayName: string | null;
}

export function SharedReportView({ report, displayName }: Props) {
  const view = normalize(report.content);
  const { jalaliStart, jalaliEnd, generatedAt } = report;
  const hasWeekData = view.metrics.activeDays + view.metrics.gapDays > 0;

  const genDate = new Date(generatedAt).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tehran",
  });

  return (
    <div className="space-y-5 animate-fade-up">
      {/* هدر: بازه هفته */}
      <div className="glass rounded-3xl px-6 py-5">
        <p className="text-[10px] text-fog tracking-widest uppercase mb-1.5">
          گزارش هفته
        </p>
        <p className="text-base font-semibold text-ink fa-num">
          {jalaliStart}
          <span className="mx-2.5 text-fog text-sm font-normal">تا</span>
          {jalaliEnd}
        </p>
        {displayName && (
          <p className="text-sm text-stone mt-1">
            از مسیر{" "}
            <span className="font-medium text-ink">{displayName}</span>
          </p>
        )}
      </div>

      {/* متریک‌های قطعی */}
      {hasWeekData && <SharedMetrics metrics={view.metrics} />}

      {/* نوار ۷ روز */}
      {view.dayStrip.length > 0 && (
        <div className="glass rounded-3xl px-6 py-5">
          <p className="text-[10px] text-fog uppercase tracking-widest mb-4">
            تقویم هفته
          </p>
          <WeekStrip strip={view.dayStrip} />
        </div>
      )}

      {/* خلاصه AI */}
      <div className="glass rounded-3xl px-6 py-5 space-y-3">
        <p className="text-[10px] text-fog uppercase tracking-widest">خلاصه</p>
        <p className="text-[15px] text-stone leading-loose whitespace-pre-line">
          {view.summary}
        </p>
      </div>

      {/* دسته‌بندی‌ها */}
      {view.categories.length > 0 && (
        <div className="glass rounded-3xl px-6 py-5">
          <Histogram categories={view.categories} />
        </div>
      )}

      {/* بینش‌ها */}
      {view.insights.length > 0 && (
        <div className="glass rounded-3xl px-6 py-5 space-y-4">
          <p className="text-[10px] text-fog uppercase tracking-widest">
            نکات هفته
          </p>
          <ul className="space-y-3">
            {view.insights.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[15px] text-stone leading-relaxed"
              >
                <span className="text-ember shrink-0 mt-[5px] text-[8px]">◆</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* تأمل شخصی + نمودارها */}
      {view.reflection && (
        <div className="glass rounded-3xl px-6 py-5 space-y-6">
          <div>
            <p className="text-[10px] text-ember/80 uppercase tracking-widest mb-3">
              تأمل شخصی
            </p>
            <blockquote className="relative pr-5">
              <span className="absolute right-0 top-0 bottom-0 w-0.5 rounded-full bg-linear-to-b from-ember/60 to-ember/10" />
              <p className="text-[15px] text-stone leading-loose">
                {view.reflection}
              </p>
            </blockquote>
          </div>

          <div className="pt-4 border-t border-black/6 space-y-5">
            {hasWeekData && (
              <ChartPanel caption="ترکیب هفته">
                <WeekDonut metrics={view.metrics} />
              </ChartPanel>
            )}
            <ChartPanel caption="نقشهٔ زندگی">
              <CategoryChart categories={view.categories} />
            </ChartPanel>
          </div>
        </div>
      )}

      {/* تاریخ ساخت */}
      <p className="text-[10px] text-fog/50 text-center fa-num">{genDate}</p>
    </div>
  );
}

// ── بخش نمودار (glass card داخلی) ────────────────────────────────────────────

function ChartPanel({
  caption,
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <p className="text-[10px] text-fog uppercase tracking-widest">{caption}</p>
      <div className="relative rounded-2xl px-5 py-5 bg-white/50 backdrop-blur-xl border border-white/60 shadow-[0_8px_28px_rgba(46,44,40,0.07)]">
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-l from-transparent via-white/80 to-transparent" />
        <div className="flex items-center justify-center min-h-40">{children}</div>
      </div>
    </section>
  );
}

// ── متریک‌های قطعی ─────────────────────────────────────────────────────────────

function SharedMetrics({ metrics }: { metrics: WeeklyMetrics }) {
  const facts = [
    { value: metrics.activeDays, of: metrics.totalDays, label: "روز فعال" },
    { value: metrics.doneCount, of: metrics.activeDays, label: "انجام شد" },
    { value: metrics.gapDays, label: "روز گپ" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {facts.map((f, i) => (
        <div
          key={f.label}
          className="rounded-2xl bg-white/50 border border-black/5 px-3 py-3.5 text-center"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div className="text-ink fa-num leading-none">
            <span className="text-xl font-semibold">
              {f.value.toLocaleString("fa-IR")}
            </span>
            {f.of !== undefined && (
              <span className="text-fog text-sm font-normal">
                {" "}از {f.of.toLocaleString("fa-IR")}
              </span>
            )}
          </div>
          <div className="text-[10px] text-fog mt-1.5">{f.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── نوار ۷ روز ──────────────────────────────────────────────────────────────────

const DAY_STYLE: Record<DayState, { cls: string; label: string }> = {
  done: { cls: "bg-sage text-white shadow-sm shadow-sage/30", label: "انجام" },
  not_done: {
    cls: "bg-ember/15 text-ember border border-ember/40",
    label: "نشد",
  },
  pending: {
    cls: "bg-fog/20 text-stone border border-fog/30",
    label: "بی‌بازخورد",
  },
  gap: {
    cls: "bg-transparent text-fog border border-dashed border-fog/50",
    label: "گپ",
  },
  freeze: {
    cls: "bg-sky-50/60 text-sky-400 border border-sky-200/60",
    label: "فریز",
  },
  empty: {
    cls: "bg-transparent text-fog/40 border border-fog/15",
    label: "خالی",
  },
};

const DAY_GLYPH: Record<DayState, string> = {
  done: "✓",
  not_done: "−",
  pending: "?",
  gap: "·",
  freeze: "⏸",
  empty: "",
};

function WeekStrip({ strip }: { strip: WeeklyDayCell[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const present = Array.from(new Set(strip.map((d) => d.state)));

  return (
    <div className="space-y-3">
      <div className="flex items-stretch justify-between gap-1.5">
        {strip.map((d, i) => {
          const st = DAY_STYLE[d.state];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-full aspect-square max-w-11 rounded-xl flex items-center justify-center
                  text-sm font-semibold transition-all duration-500 ease-out ${st.cls}
                  ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-95"}`}
                style={{ transitionDelay: `${i * 45}ms` }}
              >
                {DAY_GLYPH[d.state]}
              </div>
              <span className="text-[9px] text-fog">
                {d.weekday.replace("‌", "")}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-center">
        {present.map((s) => (
          <span key={s} className="flex items-center gap-1 text-[9px] text-fog">
            <span className={`w-2 h-2 rounded-sm ${DAY_STYLE[s].cls}`} />
            {DAY_STYLE[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── هیستوگرام ─────────────────────────────────────────────────────────────────

function Histogram({ categories }: { categories: WeeklyCategory[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const maxTotal = Math.max(...categories.map((c) => c.total), 1);

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-fog uppercase tracking-widest">
        دسته‌بندی فعالیت‌ها
      </p>
      <div className="space-y-3">
        {categories.map((cat, i) => {
          const barWidth = (cat.total / maxTotal) * 100;
          const donePct = cat.total > 0 ? (cat.doneCount / cat.total) * 100 : 0;
          return (
            <div key={cat.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone font-medium">{cat.label}</span>
                <span className="text-[10px] text-fog fa-num">
                  {cat.doneCount.toLocaleString("fa-IR")} از{" "}
                  {cat.total.toLocaleString("fa-IR")}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-black/4 overflow-hidden">
                <div
                  className="h-full rounded-full overflow-hidden transition-[width] duration-700"
                  style={{
                    width: mounted ? `${barWidth}%` : "0%",
                    transitionDelay: `${i * 90}ms`,
                    transitionTimingFunction: "var(--ease-expo)",
                  }}
                >
                  <div className="h-full w-full bg-fog/30 relative">
                    <div
                      className="absolute inset-y-0 right-0 bg-sage rounded-l-full transition-[width] duration-700"
                      style={{
                        width: mounted ? `${donePct}%` : "0%",
                        transitionDelay: `${i * 90 + 200}ms`,
                        transitionTimingFunction: "var(--ease-expo)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
