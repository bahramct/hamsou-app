// ─────────────────────────────────────────────────────────────────────────────
// /dev/charts — پیش‌نمایش نمودارهای تب تأمل (dev-only, موقت)
// گارد §۱۳: در prod اصلاً وجود ندارد (notFound). فقط برای بررسی بصری سریع.
// رادار اکنون همیشه ۶ محورِ ثابتِ زندگی دارد (DECISION-050) — سناریوها این را در
// حالت‌های پر، خلوت (۱ دسته) و کاملاً خالی نشان می‌دهند تا فرمِ ثابت دیده شود.
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import { IS_DEV_MODE } from "@/lib/env";
import { WeekDonut, CategoryChart } from "@/components/features/reports/ReflectionCharts";
import type { WeeklyMetrics, WeeklyCategory } from "@/types/weekly-report";

export const dynamic = "force-dynamic";

interface Scenario {
  title: string;
  note: string;
  metrics: WeeklyMetrics;
  categories: WeeklyCategory[];
}

const SCENARIOS: Scenario[] = [
  {
    title: "هفتهٔ پرحضور",
    note: "۷ روز فعال · رادار پر روی ۶ بُعد",
    metrics: {
      totalDays: 7, activeDays: 7, doneCount: 5, notDoneCount: 2, pendingCount: 0,
      gapDays: 0, freezeDays: 0, emptyDays: 0, doneOfCommitted: 71,
    },
    categories: [
      { label: "پروژهٔ کاری", doneCount: 3, notDoneCount: 0, total: 3, dimension: "work" },
      { label: "ورزش صبح", doneCount: 1, notDoneCount: 0, total: 1, dimension: "health" },
      { label: "دیدار دوستان", doneCount: 0, notDoneCount: 1, total: 1, dimension: "relationships" },
      { label: "مطالعهٔ کتاب", doneCount: 1, notDoneCount: 0, total: 1, dimension: "learning" },
      { label: "مدیتیشن", doneCount: 1, notDoneCount: 0, total: 1, dimension: "calm" },
    ],
  },
  {
    title: "هفتهٔ خلوت",
    note: "۲ روز فعال · فقط ۱ دسته — رادار باز هم ۶ محور",
    metrics: {
      totalDays: 7, activeDays: 2, doneCount: 2, notDoneCount: 0, pendingCount: 0,
      gapDays: 2, freezeDays: 0, emptyDays: 3, doneOfCommitted: 100,
    },
    categories: [
      { label: "تماس با خانواده", doneCount: 1, notDoneCount: 0, total: 1, dimension: "relationships" },
    ],
  },
  {
    title: "هفتهٔ کاملاً خالی",
    note: "بدون تعهد · رادار شبکه‌ایِ ۶ محور (خالی)",
    metrics: {
      totalDays: 7, activeDays: 0, doneCount: 0, notDoneCount: 0, pendingCount: 0,
      gapDays: 0, freezeDays: 0, emptyDays: 7, doneOfCommitted: 0,
    },
    categories: [],
  },
];

function ChartPanel({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-[10px] text-fog uppercase tracking-widest">{caption}</p>
      <div className="relative rounded-3xl p-6 overflow-hidden bg-white/55 backdrop-blur-xl border border-white/60 shadow-[0_10px_36px_rgba(46,44,40,0.08)]">
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-l from-transparent via-white/80 to-transparent" />
        <div className="flex items-center justify-center min-h-44">{children}</div>
      </div>
    </section>
  );
}

export default function DevChartsPreview() {
  if (!IS_DEV_MODE) notFound();

  return (
    <main className="min-h-dvh bg-paper">
      <div className="max-w-xl mx-auto px-5 py-10 space-y-10">
        <header>
          <h1 className="text-lg font-semibold text-ink">پیش‌نمایش نمودارهای تأمل</h1>
          <p className="text-xs text-fog mt-1">dev-only — سناریوهای نمونه برای بررسی بصری</p>
        </header>

        {SCENARIOS.map((s) => (
          <div key={s.title} className="space-y-4">
            <div className="flex items-baseline justify-between gap-3 border-b border-black/6 pb-2">
              <h2 className="text-sm font-semibold text-ink">{s.title}</h2>
              <span className="text-[11px] text-fog">{s.note}</span>
            </div>
            <ChartPanel caption="ترکیب هفته">
              <WeekDonut metrics={s.metrics} />
            </ChartPanel>
            <ChartPanel caption="نقشهٔ زندگی">
              <CategoryChart categories={s.categories} />
            </ChartPanel>
          </div>
        ))}
      </div>
    </main>
  );
}
