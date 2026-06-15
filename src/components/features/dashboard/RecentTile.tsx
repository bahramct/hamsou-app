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
  const top3 = entries.slice(0, 3);

  return (
    <div className="dsh-tile t-hist glass">
      <div className="dsh-lbl">تاریخچهٔ اخیر</div>

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
