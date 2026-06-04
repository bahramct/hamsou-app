"use client";

// ─────────────────────────────────────────────────────────────────────────────
// JalaliDatePicker — تاریخ‌گزین شمسی قابل‌استفادهٔ مجدد (DECISION-044)
//
// قانون: هیچ‌جای سایت/پنل از <input type="date"> بومی (میلادی mm/dd/yyyy) استفاده نکن.
// این کامپوننت تقویم شمسی نشان می‌دهد ولی مقدار را به‌صورت «yyyy-mm-dd میلادی» نگه
// می‌دارد تا با همهٔ منطق‌های downstream (parse بازه، new Date(...)، فرم GET) سازگار بماند.
//
// دو حالت مصرف:
//   ۱) فرم سروری (uncontrolled): <JalaliDatePicker name="from" defaultValue="..." />
//      → یک <input type="hidden" name=...> با مقدار میلادی می‌سازد تا فرم GET کار کند.
//   ۲) کنترل‌شده (کلاینت): <JalaliDatePicker value={iso} onChange={setIso} />
//
// توسعه‌پذیری: حالت زمان/datetime در آینده می‌تواند روی همین پایه ساخته شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useId, useRef, useState } from "react";
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_SHORT,
  isoToJalaliParts,
  jalaliPartsToISO,
  formatJalaliFromISO,
  jalaaliMonthLength,
  jalaliMonthFirstWeekday,
  jalaaliTodayParts,
} from "@/lib/utils/date";

const faNum = (n: number) => n.toLocaleString("fa-IR");

interface Props {
  /** نام فیلد برای فرم سروری — اگر داده شود یک input مخفی ساخته می‌شود */
  name?: string;
  /** حالت کنترل‌شده: مقدار میلادی «yyyy-mm-dd» یا "" */
  value?: string;
  /** مقدار اولیه در حالت uncontrolled */
  defaultValue?: string;
  /** callback حالت کنترل‌شده */
  onChange?: (iso: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** اجازهٔ پاک‌کردن (خالی‌گذاشتن) */
  clearable?: boolean;
  className?: string;
}

export function JalaliDatePicker({
  name,
  value,
  defaultValue = "",
  onChange,
  placeholder = "انتخاب تاریخ",
  disabled = false,
  clearable = true,
  className = "",
}: Props) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const selected = isControlled ? (value ?? "") : internal;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  // ماه/سال نمایش‌داده‌شده در تقویم (از مقدار انتخابی یا امروز)
  const initialView = isoToJalaliParts(selected) ?? jalaaliTodayParts();
  const [view, setView] = useState({ jy: initialView.jy, jm: initialView.jm });

  // وقتی پاپ‌اوور باز می‌شود، نمای تقویم را با مقدار فعلی هماهنگ کن
  useEffect(() => {
    if (open) {
      const p = isoToJalaliParts(selected) ?? jalaaliTodayParts();
      setView({ jy: p.jy, jm: p.jm });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // بستن با کلیک بیرون یا Escape
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function commit(iso: string) {
    if (!isControlled) setInternal(iso);
    onChange?.(iso);
  }

  function selectDay(jd: number) {
    commit(jalaliPartsToISO(view.jy, view.jm, jd));
    setOpen(false);
  }

  function moveMonth(delta: number) {
    setView((v) => {
      let jm = v.jm + delta;
      let jy = v.jy;
      if (jm < 1) { jm = 12; jy -= 1; }
      else if (jm > 12) { jm = 1; jy += 1; }
      return { jy, jm };
    });
  }

  const today = jalaaliTodayParts();
  const selParts = isoToJalaliParts(selected);
  const monthLen = jalaaliMonthLength(view.jy, view.jm);
  const lead = jalaliMonthFirstWeekday(view.jy, view.jm);
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: monthLen }, (_, i) => i + 1),
  ];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={selected} />}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink focus:outline-none focus:border-sage disabled:opacity-60"
      >
        <span className={selected ? "text-ink fa-num" : "text-fog"}>
          {selected ? formatJalaliFromISO(selected) : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && clearable && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="پاک کردن"
              onClick={(e) => { e.stopPropagation(); commit(""); }}
              className="text-fog hover:text-ember text-xs leading-none px-1"
            >
              ✕
            </span>
          )}
          <CalendarIcon />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-labelledby={labelId}
          className="absolute z-50 mt-2 w-72 rounded-2xl border border-black/8 bg-white shadow-paper-md p-3 right-0"
        >
          {/* هدر ناوبری ماه */}
          <div className="flex items-center justify-between mb-2">
            <NavBtn label="ماه بعد" onClick={() => moveMonth(1)} dir="next" />
            <div id={labelId} className="text-sm font-semibold text-ink fa-num">
              {JALALI_MONTH_NAMES[view.jm - 1]} {faNum(view.jy)}
            </div>
            <NavBtn label="ماه قبل" onClick={() => moveMonth(-1)} dir="prev" />
          </div>

          {/* سرستون روزهای هفته (شنبه‌محور) */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {JALALI_WEEKDAY_SHORT.map((w, i) => (
              <div key={i} className="text-center text-[10px] text-fog py-1">{w}</div>
            ))}
          </div>

          {/* شبکهٔ روزها */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const isSelected = selParts && selParts.jy === view.jy && selParts.jm === view.jm && selParts.jd === d;
              const isToday = today.jy === view.jy && today.jm === view.jm && today.jd === d;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={`h-8 rounded-lg text-xs fa-num transition-colors ${
                    isSelected
                      ? "bg-ink text-paper font-semibold"
                      : isToday
                      ? "bg-sage/15 text-sage-deep hover:bg-sage/25"
                      : "text-stone hover:bg-black/5"
                  }`}
                >
                  {faNum(d)}
                </button>
              );
            })}
          </div>

          {/* اقدامات سریع */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/6">
            <button
              type="button"
              onClick={() => { commit(jalaliPartsToISO(today.jy, today.jm, today.jd)); setOpen(false); }}
              className="text-[11px] text-sage-deep hover:underline"
            >
              امروز
            </button>
            {clearable && (
              <button
                type="button"
                onClick={() => { commit(""); setOpen(false); }}
                className="text-[11px] text-stone hover:text-ember"
              >
                پاک کردن
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({ label, onClick, dir }: { label: string; onClick: () => void; dir: "prev" | "next" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-stone hover:bg-black/5 transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        {/* prev = فلش راست (به ماه قبل در RTL)، next = فلش چپ */}
        <path
          d={dir === "prev" ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"}
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="text-fog shrink-0">
      <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
