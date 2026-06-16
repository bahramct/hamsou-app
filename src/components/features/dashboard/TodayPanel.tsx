"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TodayPanel — «کادر سبز» بالای داشبورد (TASK-28؛ پیاده‌سازیِ مو‌به‌موی
// mockups/dashboard-todaypanel.html). .glass + ساعتِ نقطه‌ایِ شفافِ live (عقربهٔ
// ثانیه sage) + ساعتِ دیجیتال + تاریخِ جلالی + سلامِ زمان‌آگاه + نوارِ هفتگی.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { WeekDayActivity } from "@/lib/dashboard/activity";

interface Props {
  days: WeekDayActivity[];
  /** «پنجشنبه، ۲۴ خرداد ۱۴۰۵» — سرور می‌سازد */
  dateLabel: string;
  /** نامِ ماهِ جاری — «خرداد» */
  monthLabel: string;
  /** نامِ کاربر برای سلام (اختیاری) */
  userName?: string;
}

function fa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}

interface TipState { show: boolean; x: number; y: number; title: string; text: string; faded: boolean; }

export function TodayPanel({ days, dateLabel, monthLabel, userName }: Props) {
  const hRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<HTMLDivElement>(null);
  const sRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState({ digi: "—", mer: "", greet: "" });
  const [tip, setTip] = useState<TipState>({ show: false, x: 0, y: 0, title: "", text: "", faded: false });

  // عقربه‌ها — رندرِ نرم
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const now = new Date();
      const ms = now.getMilliseconds() / 1000;
      const s = now.getSeconds() + ms;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;
      if (sRef.current) sRef.current.style.transform = `translateX(-50%) rotate(${s * 6}deg)`;
      if (mRef.current) mRef.current.style.transform = `translateX(-50%) rotate(${m * 6}deg)`;
      if (hRef.current) hRef.current.style.transform = `translateX(-50%) rotate(${h * 30}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // متن — ثانیه‌ای
  useEffect(() => {
    const nm = userName ? `، ${userName}` : "";
    const update = () => {
      const now = new Date();
      const H = now.getHours();
      const digi = fa(((H % 12) || 12) + ":" + String(now.getMinutes()).padStart(2, "0"));
      setClock({
        digi,
        mer: H < 12 ? "صبح" : H < 19 ? "عصر" : "شب",
        greet: H < 12 ? `صبح بخیر${nm}` : H < 19 ? `بعدازظهر خوبی داشته باشی${nm}` : `شب آرامی داشته باشی${nm}`,
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [userName]);

  function showTip(e: React.MouseEvent, d: WeekDayActivity) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTip({
      show: true,
      x: r.left + r.width / 2,
      y: r.top - 8,
      title: `${fa(d.jalaliDay)} ${monthLabel}${d.isToday ? " · امروز" : ""}`,
      text: d.entryContent ?? (d.state === "future" ? "هنوز نرسیده." : "آن روز تعهدی ثبت نشد."),
      faded: !d.entryContent,
    });
  }
  function hideTip() { setTip((t) => ({ ...t, show: false })); }

  const rangeLabel =
    days.length > 0 ? `${fa(days[0].jalaliDay)}–${fa(days[days.length - 1].jalaliDay)} ${monthLabel}` : monthLabel;

  return (
    <div className="dsh-tp glass">
      <div className="dsh-tp-head">
        <span className="dsh-tp-lbl">این هفته</span>
        <span className="dsh-tp-mon fa-num">{rangeLabel}</span>
      </div>

      <div className="dsh-clockzone">
        <div className="dsh-clock">
          {[0, 90, 180, 270].map((deg) => (
            <div key={deg} className="dsh-mk" style={{ transform: `translateX(-50%) rotate(${deg}deg)` }} />
          ))}
          <div className="dsh-pin" />
          <div ref={hRef} className="dsh-hand h" />
          <div ref={mRef} className="dsh-hand m" />
          <div ref={sRef} className="dsh-hand s" />
        </div>
        <div className="dsh-timeblock">
          <div className="dsh-digi"><span className="fa-num">{clock.digi}</span><span className="mer">{clock.mer}</span></div>
          <div className="dsh-jd fa-num">{dateLabel}</div>
          <div className="dsh-gr">{clock.greet}</div>
        </div>
      </div>

      <div className="dsh-tp-rule" />
      <div className="dsh-week">
        {days.map((d) => {
          const cls = d.isToday ? "today" : d.state === "future" ? "future" : "past";
          const has = d.state === "wrote";
          return (
            <div
              key={d.dateIso}
              className={`dsh-wcell ${cls}${has ? " has" : ""}`}
              onMouseEnter={(e) => showTip(e, d)}
              onMouseLeave={hideTip}
            >
              <span className="wd">{d.weekdayShort}</span>
              <span className="wn fa-num">{fa(d.jalaliDay)}</span>
            </div>
          );
        })}
      </div>

      {/* Portal به body: jp-tip با position:fixed است؛ بدونِ Portal، backdrop-filterِ
          .dsh-tp یک containing block می‌سازد و حباب جای اشتباه می‌افتد (نکته ۴). */}
      {tip.show && typeof document !== "undefined" && createPortal(
        <div className="jp-tip show" style={{ left: tip.x, top: tip.y, width: 200 }}>
          <div className="d fa-num">{tip.title}</div>
          <div className="s" style={tip.faded ? { color: "var(--color-fog)" } : undefined}>{tip.text}</div>
        </div>,
        document.body
      )}
    </div>
  );
}
