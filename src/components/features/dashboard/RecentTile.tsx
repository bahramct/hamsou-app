"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RecentTile — تایلِ «تاریخچهٔ اخیر» (TASK-28؛ مو‌به‌موی dashboard-unified.html: t-hist)
// ۳ تعهدِ آخر (نقطه + تاریخ + متنِ تک‌خطی) + CTA که مودالِ ۳۰‌روزه را باز می‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { RecentHistoryModal, type RecentEntry } from "@/components/features/history/RecentHistoryModal";

function Chevron() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RecentTile({ entries }: { entries: RecentEntry[] }) {
  const [open, setOpen] = useState(false);
  // ۲ موردِ اخیر تا با هدرِ آیکون‌دار در قابِ ثابت جا شود؛ «۳۰ روزِ اخیر» بقیه را نشان می‌دهد
  const top3 = entries.slice(0, 2);

  return (
    <div className="dsh-tile t-hist glass">
      <div className="dsh-head">
        <span className="tile-ic ic-mist" aria-hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg></span>
        <div className="dsh-lbl">تاریخچهٔ اخیر</div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {top3.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-fog">هنوز تعهدی ثبت نکرده‌ای.</p>
        ) : (
          top3.map((e) => (
            <div key={e.id} className="dsh-hist-item">
              <span className={`dsh-hist-dot ${e.feedbackStatus === "DONE" ? "done" : "miss"}`} />
              <div className="dsh-hist-body">
                <div className="dsh-hist-date fa-num">{e.weekdayLabel}، {e.dateLabel}</div>
                <div className="dsh-hist-text">{e.content}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {entries.length > 0 && (
        <div className="dsh-foot">
          <button type="button" onClick={() => setOpen(true)} className="dsh-cta">
            دیدنِ ۳۰ روزِ اخیر <Chevron />
          </button>
        </div>
      )}

      {open && <RecentHistoryModal entries={entries} onClose={() => setOpen(false)} />}
    </div>
  );
}
