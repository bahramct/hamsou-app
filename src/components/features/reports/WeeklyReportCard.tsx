"use client";

// ─────────────────────────────────────────────────────────────────────────────
// WeeklyReportCard — کارت گزارش هفتگی v3 (DECISION-047)
// سه تب: خلاصه (تصویر چندبعدی صادقانه + نوار ۷روز + هیستوگرام پویا) / نکات / تأمل
// نمودارها SVG/CSS دست‌ساز با گلس + انیمیشن نرم (بومی دیزاین‌سیستم).
// نرمال‌سازی محتوا برای سازگاری با گزارش‌های قدیمی (v1/v2).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getJalaaliWeekRange } from "@/lib/utils/date";
import { ShareModal } from "@/components/features/reports/ShareModal";
import type {
  SerializedWeeklyReport,
  WeeklyReportContent,
  WeeklyMetrics,
  WeeklyCategory,
  WeeklyDayCell,
  DayState,
} from "@/types/weekly-report";
import { WeekDonut, CategoryChart } from "@/components/features/reports/ReflectionCharts";

type Tab = "summary" | "insights" | "reflection";

const TAB_LABELS: Record<Tab, string> = {
  summary: "خلاصه",
  insights: "نکات",
  reflection: "تأمل",
};

function toFa(n: number): string {
  return n.toLocaleString("fa-IR");
}

// ─── نرمال‌سازی (سازگاری عقب با v1/v2) ─────────────────────────────────────────

interface ReportView {
  summary: string;
  metrics: WeeklyMetrics;
  dayStrip: WeeklyDayCell[];
  categories: WeeklyCategory[];
  insights: { text: string }[];
  reflection: string | null;
}

function normalize(c: WeeklyReportContent): ReportView {
  // متریک‌ها: v3 آماده است؛ گزارش قدیمی از فیلدهای legacy بازسازی می‌شود
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

// ─── کارت اصلی ────────────────────────────────────────────────────────────────

interface Props {
  report: SerializedWeeklyReport;
  userPlan: string;
  /** زمان آخرین ارتقا به پلن پولی (ISO) — null یعنی کاربر قدیمی (پیش‌فرض: دسترسی کامل) */
  planPaidSince?: string | null;
  /** پیش‌فرض باز؟ — برای اولین کارت صفحه اول (پیش‌فرض: بسته) */
  defaultExpanded?: boolean;
}

export function WeeklyReportCard({ report, userPlan, planPaidSince = null, defaultExpanded = false }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { jalaliStart, jalaliEnd, meta, generatedAt } = report;
  const view = normalize(report.content);

  const genDate = new Date(generatedAt).toLocaleDateString("fa-IR", {
    dateStyle: "short",
    timeZone: "Asia/Tehran",
  });

  // تب تأمل/اشتراک‌گذاری فقط برای هفته‌هایی که کاربر پلن پولی داشته باز است.
  // اگر planPaidSince=null (کاربر قدیمی) و پلن پولی → دسترسی کامل.
  // اگر planPaidSince دارد → فقط هفته‌هایی که weekStart ≥ ابتدای هفتهٔ ارتقا.
  const isPaidPlan = useMemo(() => {
    if (userPlan === "FREE") return false;
    if (!planPaidSince) return true;
    const upgradeWeekStart = getJalaaliWeekRange(new Date(planPaidSince)).weekStart;
    return new Date(report.weekStart) >= upgradeWeekStart;
  }, [userPlan, planPaidSince, report.weekStart]);

  return (
    <article className="glass rounded-3xl overflow-hidden animate-fade-up">
      {/* ── هدر کارت — همیشه نمایان؛ کلیک = باز/بسته ── */}
      <header
        className="px-6 py-4 flex items-center gap-4 cursor-pointer select-none"
        style={{ borderBottom: isExpanded ? "1px solid rgba(var(--rgb-line),0.06)" : "none" }}
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-fog tracking-widest uppercase mb-1">گزارش هفته</p>
          <p className="text-sm font-semibold text-ink fa-num">
            {jalaliStart}
            <span className="mx-2 text-fog font-normal text-xs">←</span>
            {jalaliEnd}
          </p>
        </div>

        {/* دکمه اشتراک‌گذاری — کلیک جداگانه (stopPropagation) */}
        <div onClick={(e) => e.stopPropagation()}>
          <ShareButton
            reportId={report.id}
            initialShared={report.isShared}
            weekLabel={`${jalaliStart} ← ${jalaliEnd}`}
            isPaidPlan={isPaidPlan}
          />
        </div>

        {/* شیوون باز/بسته */}
        <span
          className="shrink-0 text-fog/50 transition-transform duration-300"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </header>

      {/* ── محتوا — فقط وقتی باز باشد ── */}
      {isExpanded && (
        <>
          {/* تب‌ها */}
          <div className="flex border-b border-black/5 bg-black/1.5">
            {(["summary", "insights", "reflection"] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 py-3 text-sm font-medium transition-colors duration-200
                  flex items-center justify-center gap-1.5
                  ${activeTab === tab ? "text-ember" : "text-stone hover:text-ink"}`}
              >
                {TAB_LABELS[tab]}
                {tab === "reflection" && !isPaidPlan && <LockIcon />}
                {activeTab === tab && (
                  <span className="absolute bottom-0 h-0.5 w-10 rounded-full bg-ember translate-y-px" />
                )}
              </button>
            ))}
          </div>

          {/* محتوای تب */}
          <div className="px-6 py-6 min-h-40">
            {activeTab === "summary" && <SummaryTab view={view} />}
            {activeTab === "insights" && <InsightsTab insights={view.insights} />}
            {activeTab === "reflection" && (
              <ReflectionTab
                reflection={view.reflection}
                isPaidPlan={isPaidPlan}
                metrics={view.metrics}
                categories={view.categories}
              />
            )}
          </div>

          {/* فوتر */}
          <footer className="px-6 pb-4 flex items-center gap-1.5 text-[10px] text-fog/60 fa-num">
            <span>{genDate}</span>
            <span className="text-fog/30">·</span>
            <span>{meta.provider}</span>
            <span className="text-fog/30">·</span>
            <span>{toFa(meta.outputTokens)} توکن</span>
          </footer>
        </>
      )}
    </article>
  );
}

// ─── تب خلاصه ────────────────────────────────────────────────────────────────

function SummaryTab({ view }: { view: ReportView }) {
  const { metrics, dayStrip, categories, summary } = view;
  const hasWeek = metrics.activeDays > 0 || dayStrip.length > 0;

  return (
    <div className="space-y-6">
      {hasWeek && <HonestHeader metrics={metrics} />}
      {dayStrip.length > 0 && <WeekStrip strip={dayStrip} />}
      {categories.length > 0 && <Histogram categories={categories} />}

      <p className="text-[15px] text-stone leading-loose whitespace-pre-line">{summary}</p>
    </div>
  );
}

// ─── سرآیند صادقانهٔ چندبعدی ──────────────────────────────────────────────────

function HonestHeader({ metrics }: { metrics: WeeklyMetrics }) {
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
          className="rounded-2xl bg-white/45 border border-black/5 px-3 py-3 text-center animate-fade-up"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div className="text-ink fa-num leading-none">
            <span className="text-xl font-semibold">{toFa(f.value)}</span>
            {f.of !== undefined && (
              <span className="text-fog text-sm font-normal"> از {toFa(f.of)}</span>
            )}
          </div>
          <div className="text-[10px] text-fog mt-1.5">{f.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── نوار ۷ روز هفته ──────────────────────────────────────────────────────────

const DAY_STYLE: Record<DayState, { cls: string; label: string }> = {
  done: { cls: "bg-sage text-white shadow-sm shadow-sage/30", label: "انجام" },
  not_done: { cls: "bg-ember/15 text-ember border border-ember/40", label: "نشد" },
  pending: { cls: "bg-fog/20 text-stone border border-fog/30", label: "بی‌بازخورد" },
  gap: { cls: "bg-transparent text-fog border border-dashed border-fog/50", label: "گپ" },
  freeze: { cls: "bg-mist/15 text-mist-deep border border-mist/40", label: "فریز" },
  empty: { cls: "bg-transparent text-fog/40 border border-fog/15", label: "خالی" },
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

  // وضعیت‌های موجود برای راهنما
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
                title={`${d.weekday} — ${st.label}`}
              >
                {DAY_GLYPH[d.state]}
              </div>
              <span className="text-[9px] text-fog">{d.weekday.replace("‌", "")}</span>
            </div>
          );
        })}
      </div>

      {/* راهنما */}
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

// ─── هیستوگرام دستهٔ پویا ──────────────────────────────────────────────────────

function Histogram({ categories }: { categories: WeeklyCategory[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const maxTotal = Math.max(...categories.map((c) => c.total), 1);

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-fog uppercase tracking-widest">دسته‌بندی فعالیت‌ها</p>
      <div className="space-y-3">
        {categories.map((cat, i) => {
          const barWidth = (cat.total / maxTotal) * 100; // سهم نسبی دسته
          const donePct = cat.total > 0 ? (cat.doneCount / cat.total) * 100 : 0;
          return (
            <div key={cat.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone font-medium">{cat.label}</span>
                <span className="text-[10px] text-fog fa-num">
                  {toFa(cat.doneCount)} از {toFa(cat.total)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-black/4 overflow-hidden">
                {/* عرض کل میله = سهم دسته؛ داخلش بخش «انجام شد» پررنگ‌تر */}
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

// ─── تب نکات ─────────────────────────────────────────────────────────────────

function InsightsTab({ insights }: { insights: { text: string }[] }) {
  if (insights.length === 0) {
    return <p className="text-sm text-fog italic pt-2">نکته‌ای برای این هفته ثبت نشده.</p>;
  }
  return (
    <ul className="space-y-3.5">
      {insights.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-2xl bg-white/40 border border-black/5 px-4 py-3.5
            text-[15px] text-stone leading-relaxed animate-fade-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="text-ember shrink-0 mt-1.5 text-[8px]">◆</span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── تب تأمل ─────────────────────────────────────────────────────────────────

function ReflectionTab({
  reflection,
  isPaidPlan,
  metrics,
  categories,
}: {
  reflection: string | null;
  isPaidPlan: boolean;
  metrics: WeeklyMetrics;
  categories: WeeklyCategory[];
}) {
  if (!isPaidPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <div className="w-11 h-11 rounded-full bg-black/5 flex items-center justify-center">
          <LockIcon size={18} />
        </div>
        <p className="text-sm text-ink font-medium">تأمل شخصی برای اعضای Plus و Pro</p>
        <p className="text-xs text-fog leading-relaxed max-w-60">
          نگاهی عمیق‌تر به یک نکتهٔ مشخص از هفته‌ات، گره‌خورده به روندِ هفته‌های گذشته، با یک سؤال واقعی برای اندیشیدن.
        </p>
        <Link href="/plans" className="text-xs text-ember hover:underline transition-colors mt-1">
          مشاهده پلن‌ها
        </Link>
      </div>
    );
  }

  if (!reflection) {
    return <p className="text-sm text-fog italic pt-2">تأملی برای این هفته ثبت نشده.</p>;
  }

  const hasWeekData = metrics.activeDays + metrics.gapDays > 0;

  return (
    <div className="animate-fade-up space-y-7">
      {/* متن تأمل */}
      <div>
        <p className="text-[10px] text-ember/80 uppercase tracking-widest mb-3">تأمل شخصی</p>
        <blockquote className="relative pr-5">
          <span className="absolute right-0 top-0 bottom-0 w-0.5 rounded-full bg-linear-to-b from-ember/60 to-ember/10" />
          <p className="text-[15px] text-stone leading-loose">{reflection}</p>
        </blockquote>
      </div>

      {/* دو نمودار — ترکیب هفته + نقشهٔ زندگی (پشتِ‌سرهم، تمام‌عرض).
          رادار همیشه روی ۶ بُعدِ ثابت رسم می‌شود (DECISION-050) — حتی هفتهٔ خلوت. */}
      <div className="pt-6 border-t border-black/6 space-y-5">
        {hasWeekData && (
          <ChartPanel caption="ترکیب هفته">
            <WeekDonut metrics={metrics} />
          </ChartPanel>
        )}
        <ChartPanel caption="نقشهٔ زندگی">
          <CategoryChart categories={categories} />
        </ChartPanel>
      </div>
    </div>
  );
}

function ChartPanel({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 animate-fade-up">
      <p className="text-[10px] text-fog uppercase tracking-widest">{caption}</p>
      <div className="relative rounded-3xl p-6 overflow-hidden bg-white/55 backdrop-blur-xl border border-white/60 shadow-[0_10px_36px_rgba(46,44,40,0.08)]">
        {/* خط هایلایتِ بالا — حسِ شیشه */}
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-l from-transparent via-white/80 to-transparent" />
        <div className="flex items-center justify-center min-h-44">{children}</div>
      </div>
    </section>
  );
}

// ─── آیکون قفل ───────────────────────────────────────────────────────────────

function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="text-fog/60 shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

// ─── دکمهٔ اشتراک‌گذاری (باز کنندهٔ مودال) ─────────────────────────────────────

function ShareButton({
  reportId,
  initialShared,
  weekLabel,
  isPaidPlan,
}: {
  reportId: string;
  initialShared: boolean;
  weekLabel: string;
  isPaidPlan: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isShared, setIsShared] = useState(initialShared);

  if (!isPaidPlan) {
    return (
      <button
        type="button"
        disabled
        aria-label="اشتراک‌گذاری و دانلود گزارش — برای اعضای Plus و Pro"
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
          text-xs font-medium text-fog/40 cursor-not-allowed select-none"
      >
        <ShareGlyph />
        <span>اشتراک‌گذاری و دانلود</span>
        <LockIcon size={10} />
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="اشتراک‌گذاری و دانلود گزارش"
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
          text-xs font-medium text-stone/60 hover:text-stone transition-colors duration-200"
      >
        {/* نقطهٔ کوچک وقتی گزارش به‌اشتراک گذاشته شده — بدون تغییر رنگ کل دکمه */}
        <span className="relative shrink-0">
          <ShareGlyph />
          {isShared && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sage" />
          )}
        </span>
        <span>اشتراک‌گذاری و دانلود</span>
      </button>
      <ShareModal
        reportId={reportId}
        weekLabel={weekLabel}
        isOpen={open}
        initialShared={isShared}
        onClose={() => setOpen(false)}
        onSharedChange={setIsShared}
      />
    </>
  );
}

function ShareGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.75" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
