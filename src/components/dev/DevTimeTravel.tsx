"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DevTimeTravel — پنل dev برای جابجایی زمان سرور (time-travel)
// لایه ۳ از معماری Dev/Prod (CLAUDE.md §۱۳, DECISION-021).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IS_DEV_MODE } from "@/lib/env";

type TimeState = {
  isShifted: boolean;
  offsetMs: number;
  simulatedNow: string;
};

function isoToDatetimeLocal(iso: string): string {
  return iso.slice(0, 16);
}

function formatOffset(ms: number): string {
  if (ms === 0) return "زمان واقعی";
  const totalMinutes = Math.round(Math.abs(ms) / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const mins = totalMinutes % 60;
  const sign = ms > 0 ? "+" : "−";
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} روز`);
  if (hours > 0) parts.push(`${hours} ساعت`);
  if (mins > 0) parts.push(`${mins} دقیقه`);
  return `${sign}${parts.join(" و ")}`;
}

function formatSimulatedNow(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  });
}

export function DevTimeTravel() {
  if (!IS_DEV_MODE) return null;
  return <DevTimeTravelInner />;
}

function DevTimeTravelInner() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [timeState, setTimeState] = useState<TimeState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dev/time/set")
      .then((r) => r.json())
      .then((data: TimeState & { ok: boolean }) => {
        if (data.ok) {
          setTimeState(data);
          setInputValue(isoToDatetimeLocal(data.simulatedNow));
        }
      })
      .catch(() => setLoadError("خواندن وضعیت زمان سرور ناموفق بود"));
  }, []);

  async function applyTimeChange(body: { targetIso: string } | { offsetDays: number }) {
    setActionError(null);
    try {
      const res = await fetch("/api/dev/time/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setActionError(data.error ?? "خطای ناشناخته"); return; }
      setTimeState(data);
      setInputValue(isoToDatetimeLocal(data.simulatedNow));
      startTransition(() => router.refresh());
    } catch {
      setActionError("اتصال به سرور ناموفق بود");
    }
  }

  async function resetTime() {
    setActionError(null);
    try {
      const res = await fetch("/api/dev/time/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) { setActionError(data.error ?? "خطای ناشناخته"); return; }
      setTimeState(data);
      setInputValue(isoToDatetimeLocal(data.simulatedNow));
      startTransition(() => router.refresh());
    } catch {
      setActionError("اتصال به سرور ناموفق بود");
    }
  }

  const isLoading = timeState === null && !loadError;

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {/* عنوان + badge وضعیت */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wide text-ember uppercase">
          ⏰ Time Travel
        </span>
        {timeState && (
          <span
            className={`
              text-[10px] px-1.5 py-0.5 rounded font-medium
              ${timeState.isShifted
                ? "bg-amber-500/25 text-amber-300"
                : "bg-green-500/20 text-green-300"}
            `}
          >
            {timeState.isShifted ? "جابجا شده" : "زمان واقعی"}
          </span>
        )}
      </div>

      {/* loading / error */}
      {isLoading && (
        <p className="text-[11px] text-fog animate-pulse">در حال خواندن وضعیت…</p>
      )}
      {loadError && (
        <p className="text-[11px] text-red-400">{loadError}</p>
      )}

      {/* نمایش زمان شبیه‌سازی‌شده */}
      {timeState && (
        <div className="rounded-lg bg-white/8 border border-white/15 px-3 py-2 flex flex-col gap-0.5">
          <span className="text-[10px] text-fog">زمان سرور</span>
          <span className="text-[13px] font-semibold text-bone" dir="rtl">
            {formatSimulatedNow(timeState.simulatedNow)}
          </span>
          {timeState.isShifted && (
            <span className="text-[10px] text-amber-300 mt-0.5">
              {formatOffset(timeState.offsetMs)}
            </span>
          )}
        </div>
      )}

      {/* دکمه‌های سریع */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "−۷", offsetDays: -7 },
          { label: "−۱", offsetDays: -1 },
          { label: "+۱", offsetDays: +1 },
          { label: "+۷", offsetDays: +7 },
        ].map(({ label, offsetDays }) => (
          <button
            key={offsetDays}
            type="button"
            disabled={isLoading || isPending}
            onClick={() => applyTimeChange({ offsetDays })}
            className="
              px-1 py-2 rounded-lg text-[11px] font-semibold
              bg-white/10 text-bone border border-white/20
              hover:bg-ember/25 hover:text-ember hover:border-ember/40
              active:scale-[0.97] disabled:opacity-40
              transition-all duration-150
            "
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-[9px] text-fog/70 -mt-1 text-center">روز</p>

      {/* فیلد تاریخ دقیق */}
      <div className="flex gap-1.5">
        <input
          type="datetime-local"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          className="
            flex-1 min-w-0 px-2 py-1.5 rounded-lg text-[11px]
            bg-white/10 text-bone border border-white/20
            focus:outline-none focus:border-ember/50
            disabled:opacity-40
          "
          dir="ltr"
        />
        <button
          type="button"
          disabled={isLoading || isPending || !inputValue}
          onClick={() => applyTimeChange({ targetIso: new Date(inputValue).toISOString() })}
          className="
            px-3 py-1.5 rounded-lg text-[11px] font-semibold shrink-0
            bg-ember text-paper
            hover:bg-ember/80 active:scale-[0.97]
            disabled:opacity-40
            transition-all duration-150
          "
        >
          برو
        </button>
      </div>

      {/* دکمه ریست */}
      {timeState?.isShifted && (
        <button
          type="button"
          disabled={isPending}
          onClick={resetTime}
          className="
            w-full px-3 py-2 rounded-lg text-[11px] font-medium
            border border-white/25 text-fog
            hover:border-green-400/50 hover:text-green-300
            active:scale-[0.98] disabled:opacity-40
            transition-all duration-150
          "
        >
          ↺ بازگشت به زمان واقعی
        </button>
      )}

      {actionError && (
        <p className="text-[10px] text-red-400">{actionError}</p>
      )}

      <p className="text-[9px] text-fog/60 leading-relaxed">
        با restart سرور زمان به حالت واقعی برمی‌گردد.
      </p>
    </div>
  );
}
