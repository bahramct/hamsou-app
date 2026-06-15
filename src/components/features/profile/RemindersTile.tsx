"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RemindersTile — تایلِ «یادآوری‌ها و اعلان‌ها» (بازطراحی DECISION-096)
// فعلاً فقط UI (تصمیمِ مالک): سوییچ‌ها حالتِ محلی دارند و هنوز ذخیره نمی‌شوند؛
// زیرساختِ ارسالِ یادآوریِ زمان‌محور در موجِ ۲ اضافه می‌شود (CLAUDE.md §۱۰، §۸).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

interface ReminderRow { key: string; title: string; hint: string; on: boolean; }

const INITIAL: ReminderRow[] = [
  { key: "daily", title: "یادآوریِ تعهدِ روزانه", hint: "هر روز ساعت ۲۱:۰۰", on: true },
  { key: "weekly", title: "یادآوریِ گزارشِ هفتگی", hint: "جمعه‌ها، پایانِ هفته", on: true },
  { key: "support", title: "پاسخِ پشتیبانی", hint: "وقتی تیکتت پاسخ گرفت", on: true },
  { key: "finance", title: "رویدادهای مالی و پلن", hint: "شارژ، خرید و تغییرِ پلن", on: false },
];

export function RemindersTile() {
  const [rows, setRows] = useState<ReminderRow[]>(INITIAL);

  function toggle(key: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, on: !r.on } : r)));
  }

  return (
    <section className="pf-tile pf-t-reminders glass">
      <div className="pf-tile-head">
        <div className="pf-tile-ic ic-rem"><BellIcon /></div>
        <div>
          <h3>یادآوری‌ها و اعلان‌ها</h3>
          <div className="sub">چه چیزی و چه زمانی یادت بیندازیم</div>
        </div>
      </div>

      {rows.map((r) => (
        <div className="pf-rm-row" key={r.key}>
          <div className="pf-rm-info">
            <div className="t">{r.title}</div>
            <div className="h">{r.hint}</div>
          </div>
          <button
            type="button"
            className={`pf-switch ${r.on ? "on" : ""}`}
            role="switch"
            aria-checked={r.on}
            aria-label={r.title}
            onClick={() => toggle(r.key)}
          >
            <i />
          </button>
        </div>
      ))}

      <div className="pf-rm-foot">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        اعلان‌ها از طریقِ زنگوله و (به‌زودی) پیامک دریافت می‌شوند.
      </div>
    </section>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
