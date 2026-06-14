"use client";

// ─────────────────────────────────────────────────────────────────────────────
// JalaliDatePicker — تاریخ‌گزین شمسی قابل‌استفادهٔ مجدد (DECISION-044)
//
// سه view: day → month → year (کلیک روی ماه/سال در header).
// ارقام سال بدون جداکننده هزارتایی (faYear) — نه fa-IR locale.
// جهت فلش‌ها مطابق RTL: › (راست) = قبلی، ‹ (چپ) = بعدی.
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

// اعداد فارسی بدون جداکننده (برای سال)
const faYear = (y: number) => String(y).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
// اعداد فارسی با locale (برای روز و شماره‌های کوچک)
const faNum = (n: number) => n.toLocaleString("fa-IR");

type ViewMode = "day" | "month" | "year";

interface Props {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  /**
   * inline=true → تقویم در جریانِ عادیِ صفحه (relative، تمام‌عرض) باز می‌شود و
   * محتوا را پایین می‌راند، نه absolute شناور. برای مودال‌هایی که نباید تقویم از
   * کادر بیرون بزند (مثل FreezeModal) — کانتینرِ اسکرول‌پذیر آن را در بر می‌گیرد.
   */
  inline?: boolean;
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
  inline = false,
}: Props) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const selected = isControlled ? (value ?? "") : internal;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ViewMode>("day");
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  const initialView = isoToJalaliParts(selected) ?? jalaaliTodayParts();
  const [view, setView] = useState({ jy: initialView.jy, jm: initialView.jm });
  const [yearPageStart, setYearPageStart] = useState(Math.floor(initialView.jy / 12) * 12);

  // sync view وقتی پاپ‌اوور باز می‌شود
  useEffect(() => {
    if (open) {
      const p = isoToJalaliParts(selected) ?? jalaaliTodayParts();
      setView({ jy: p.jy, jm: p.jm });
      setYearPageStart(Math.floor(p.jy / 12) * 12);
      setMode("day");
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

  function selectMonth(m: number) {
    setView((v) => ({ ...v, jm: m }));
    setMode("day");
  }

  function selectYear(y: number) {
    setView((v) => ({ ...v, jy: y }));
    setMode("month");
  }

  // nav در هر mode: -1 = قبلی (راست در RTL)، +1 = بعدی (چپ در RTL)
  function moveNav(delta: number) {
    if (mode === "day") {
      setView((v) => {
        let jm = v.jm + delta;
        let jy = v.jy;
        if (jm < 1) { jm = 12; jy -= 1; }
        else if (jm > 12) { jm = 1; jy += 1; }
        return { jy, jm };
      });
    } else if (mode === "month") {
      setView((v) => ({ ...v, jy: v.jy + delta }));
    } else {
      setYearPageStart((s) => s + delta * 12);
    }
  }

  const today = jalaaliTodayParts();
  const selParts = isoToJalaliParts(selected);
  const monthLen = jalaaliMonthLength(view.jy, view.jm);
  const lead = jalaliMonthFirstWeekday(view.jy, view.jm);
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: monthLen }, (_, i) => i + 1),
  ];

  const years = Array.from({ length: 12 }, (_, i) => yearPageStart + i);

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
          className={
            inline
              ? "relative z-10 mt-2 w-full rounded-2xl border border-black/8 bg-white shadow-paper-md p-3"
              : "absolute z-50 mt-2 w-72 rounded-2xl border border-black/8 bg-white shadow-paper-md p-3 right-0"
          }
        >
          {/* ─── هدر ناوبری ─── */}
          <div className="flex items-center justify-between mb-2">
            {/* در RTL: اولین child = راست → این «قبلی» است */}
            <NavBtn label="قبلی" onClick={() => moveNav(-1)} dir="prev" />

            <div id={labelId} className="flex items-center gap-1 text-sm font-semibold text-ink">
              {mode === "day" && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode("month")}
                    className="hover:text-sage-deep transition-colors px-1 rounded"
                  >
                    {JALALI_MONTH_NAMES[view.jm - 1]}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setYearPageStart(Math.floor(view.jy / 12) * 12); setMode("year"); }}
                    className="hover:text-sage-deep transition-colors px-1 rounded fa-num"
                  >
                    {faYear(view.jy)}
                  </button>
                </>
              )}
              {mode === "month" && (
                <button
                  type="button"
                  onClick={() => { setYearPageStart(Math.floor(view.jy / 12) * 12); setMode("year"); }}
                  className="hover:text-sage-deep transition-colors px-1 rounded fa-num"
                >
                  {faYear(view.jy)}
                </button>
              )}
              {mode === "year" && (
                <span className="fa-num text-xs">
                  {faYear(yearPageStart)} — {faYear(yearPageStart + 11)}
                </span>
              )}
            </div>

            {/* در RTL: آخرین child = چپ → این «بعدی» است */}
            <NavBtn label="بعدی" onClick={() => moveNav(1)} dir="next" />
          </div>

          {/* ─── محتوا بر اساس mode ─── */}
          {mode === "day" && (
            <>
              {/* سرستون روزهای هفته */}
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
                  onClick={() => {
                    commit(jalaliPartsToISO(today.jy, today.jm, today.jd));
                    setOpen(false);
                  }}
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
            </>
          )}

          {mode === "month" && (
            <div className="grid grid-cols-3 gap-1.5 my-1">
              {JALALI_MONTH_NAMES.map((name, i) => {
                const isCurrentMonth = selParts && selParts.jy === view.jy && selParts.jm === (i + 1);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectMonth(i + 1)}
                    className={`py-2 rounded-xl text-xs transition-colors ${
                      isCurrentMonth
                        ? "bg-ink text-paper font-semibold"
                        : "text-stone hover:bg-black/5"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}

          {mode === "year" && (
            <div className="grid grid-cols-3 gap-1.5 my-1">
              {years.map((y) => {
                const isCurrentYear = selParts && selParts.jy === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => selectYear(y)}
                    className={`py-2 rounded-xl text-xs fa-num transition-colors ${
                      isCurrentYear
                        ? "bg-ink text-paper font-semibold"
                        : "text-stone hover:bg-black/5"
                    }`}
                  >
                    {faYear(y)}
                  </button>
                );
              })}
            </div>
          )}
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
        {/* در RTL: prev = › (راست = عقب)، next = ‹ (چپ = جلو) */}
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
