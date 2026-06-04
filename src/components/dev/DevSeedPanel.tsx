"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DevSeedPanel — پنل dev برای تولید داده تستی
// لایه ۳ از معماری Dev/Prod (CLAUDE.md §۱۳, DECISION-021).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IS_DEV_MODE } from "@/lib/env";

// ─────────────────────────────────────────────────────────────────────────────
// راهنمای سناریوهای تست — با هر فیچر جدید اینجا اضافه شود
// ─────────────────────────────────────────────────────────────────────────────
const SCENARIOS: Array<{
  title: string;
  seed: string;
  flow: string[];
}> = [
  {
    title: "جریان بازخورد + فاصله",
    seed: "«سناریوی فاصله» را بزن",
    flow: [
      "داشبورد: بازخورد تعهد قبلی",
      "← توضیح فاصله غیرفعالی",
      "← ثبت تعهد امروز",
    ],
  },
  {
    title: "تست گزارش هفتگی",
    seed: "«۷ روز + بازخورد» را بزن",
    flow: [
      "یک هفته تاریخچه کامل (همه با بازخورد)",
      "← برو به /history یا تست AI",
    ],
  },
  {
    title: "تاریخچه سفارشی",
    seed: "عدد دلخواه بگذار → «روز تعهد (با بازخورد)»",
    flow: [
      "N روز تعهد، همه با بازخورد (state واقعی)",
      "← برای تست pagination یا تاریخچه بلند",
    ],
  },
  {
    title: "تست زمان‌محور",
    seed: "تب «⏰ زمان» را باز کن",
    flow: [
      "با دکمه‌های +/− روز جابجا شو",
      "← هر بار router refresh می‌شود",
    ],
  },
];

export function DevSeedPanel() {
  if (!IS_DEV_MODE) return null;
  return <DevSeedPanelInner />;
}

function DevSeedPanelInner() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [daysInput, setDaysInput] = useState("7");
  const [showGuide, setShowGuide] = useState(false);

  async function callAPI(url: string, body?: object): Promise<boolean> {
    setStatus(null);
    setIsError(false);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setIsError(true);
        setStatus(data.error ?? "خطای ناشناخته");
        return false;
      }
      return true;
    } catch {
      setIsError(true);
      setStatus("اتصال به سرور ناموفق بود");
      return false;
    }
  }

  async function handleFullWeek() {
    const ok = await callAPI("/api/dev/seed/full-week");
    if (ok) { setStatus("✓ یک هفته کامل seed شد"); startTransition(() => router.refresh()); }
  }

  async function handleSeedEntries() {
    const days = Math.max(1, Math.min(30, parseInt(daysInput, 10) || 7));
    const ok = await callAPI("/api/dev/seed/entries", { days });
    if (ok) { setStatus(`✓ ${days} تعهد seed شد`); startTransition(() => router.refresh()); }
  }

  async function handleGapScenario() {
    const ok = await callAPI("/api/dev/seed/gap-scenario");
    if (ok) { setStatus("✓ سناریوی فاصله seed شد"); startTransition(() => router.refresh()); }
  }

  async function handleReset() {
    const ok = await callAPI("/api/dev/reset/me");
    if (ok) { setStatus("✓ داده‌های seed پاک شدند"); startTransition(() => router.refresh()); }
  }

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {/* هدر + toggle راهنما */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wide text-ember uppercase">
          🌱 Seed Data
        </span>
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className={`
            text-[10px] px-1.5 py-0.5 rounded transition-colors
            ${showGuide
              ? "bg-white/15 text-bone"
              : "text-fog/60 hover:text-fog"
            }
          `}
        >
          {showGuide ? "× بستن" : "? راهنما"}
        </button>
      </div>

      {/* راهنمای سناریوها — collapsible */}
      {showGuide && (
        <div className="flex flex-col gap-2.5 rounded-lg bg-white/5 border border-white/10 p-2.5">
          {SCENARIOS.map((s) => (
            <div key={s.title}>
              <p className="text-[10px] font-semibold text-ember mb-0.5">{s.title}</p>
              <p className="text-[9.5px] text-fog/80 mb-1">seed: {s.seed}</p>
              {s.flow.map((step, i) => (
                <p key={i} className="text-[9.5px] text-fog/70 leading-relaxed">{step}</p>
              ))}
            </div>
          ))}
          <p className="text-[9px] text-fog/50 border-t border-white/10 pt-2 mt-0.5">
            reset همه داده‌های seed + GapRecord + زمان را پاک می‌کند
          </p>
        </div>
      )}

      {/* یک هفته کامل — اصلی‌ترین دکمه */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleFullWeek}
        className="
          w-full px-3 py-2.5 rounded-lg text-[12px] font-semibold
          bg-ember text-paper
          hover:bg-ember/80 active:scale-[0.98]
          disabled:opacity-40
          transition-all duration-150
        "
      >
        ۷ روز + بازخورد (آماده تست گزارش)
      </button>

      {/* سناریوی فاصله — تست جریان بازخورد + gap */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleGapScenario}
        className="
          w-full px-3 py-2.5 rounded-lg text-[12px] font-semibold
          bg-white/15 text-bone border border-white/20
          hover:bg-ember/20 hover:text-ember hover:border-ember/40
          active:scale-[0.98] disabled:opacity-40
          transition-all duration-150
        "
      >
        سناریوی فاصله (بازخورد + غیبت)
      </button>

      {/* Seed تعهد با تعداد دلخواه */}
      <div className="flex gap-1.5">
        <input
          type="number"
          min={1}
          max={30}
          value={daysInput}
          onChange={(e) => setDaysInput(e.target.value)}
          className="
            w-14 px-2 py-1.5 rounded-lg text-[12px] font-semibold text-center
            bg-white/10 text-bone border border-white/20
            focus:outline-none focus:border-ember/50
          "
          dir="ltr"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={handleSeedEntries}
          className="
            flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium
            bg-white/10 text-bone border border-white/20
            hover:bg-ember/20 hover:text-ember hover:border-ember/40
            active:scale-[0.97] disabled:opacity-40
            transition-all duration-150
          "
        >
          روز تعهد (با بازخورد)
        </button>
      </div>

      {/* خط جدا */}
      <div className="border-t border-white/15" />

      {/* ریست */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleReset}
        className="
          w-full px-3 py-1.5 rounded-lg text-[11px] font-medium
          border border-dashed border-red-400/40 text-fog
          hover:border-red-400/70 hover:text-red-300
          active:scale-[0.98] disabled:opacity-40
          transition-all duration-150
        "
      >
        🗑 پاک کردن همه داده‌های seed
      </button>

      {/* وضعیت */}
      {status && (
        <p className={`text-[11px] font-medium ${isError ? "text-red-400" : "text-green-300"}`}>
          {status}
        </p>
      )}
    </div>
  );
}
