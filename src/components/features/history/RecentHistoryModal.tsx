"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RecentHistoryModal — مودالِ «۳۰ روزِ اخیر» در داشبورد (TASK-28 / DECISION-092)
// مودالِ controlled: والد (RecentTile) باز/بسته‌شدن را مدیریت می‌کند.
// صفحهٔ /history حذف شده (DECISION-092)، پس هیچ لینکِ «مشاهده همه» نیست.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

export interface RecentEntry {
  id: string;
  content: string;
  dateLabel: string;
  weekdayLabel: string;
  feedbackStatus: "DONE" | "NOT_DONE" | null;
}

export function RecentHistoryModal({
  entries,
  onClose,
}: {
  entries: RecentEntry[];
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  // انیمیشن ورود
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // قفل اسکرول صفحه
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  // بستن با Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={handleClose}
        className="fixed inset-0 z-50"
        style={{
          background: "rgba(26,26,31,0.22)",
          backdropFilter: visible ? "blur(6px)" : "none",
          opacity: visible ? 1 : 0,
          transition: "opacity 220ms ease, backdrop-filter 220ms ease",
        }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-5 pointer-events-none"
        aria-modal="true"
        role="dialog"
        aria-label="تاریخچه اخیر"
      >
        <div
          className="w-full max-w-sm pointer-events-auto overflow-hidden
                     rounded-3xl border border-black/8
                     shadow-[0_20px_60px_rgba(26,26,31,0.18),0_0_0_1px_rgba(255,255,255,0.5)_inset]"
          style={{
            background: "rgba(var(--rgb-paper),0.92)",
            backdropFilter: "blur(24px) saturate(140%)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.94)",
            transition: "opacity 220ms ease, transform 280ms cubic-bezier(0.19,1,0.22,1)",
          }}
        >
          {/* هدر */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/6">
            <h2 className="text-sm font-semibold text-ink">۳۰ روزِ اخیر</h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="بستن"
              className="w-7 h-7 rounded-full bg-black/6 hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* لیست تعهدها */}
          <div className="px-4 py-3 space-y-2 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {entries.length === 0 ? (
              <p className="py-8 text-center text-xs text-fog">هنوز تعهدی ثبت نکرده‌ای.</p>
            ) : (
              entries.map((entry) => <EntryRow key={entry.id} entry={entry} />)
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ردیف تعهد ───────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: RecentEntry }) {
  let statusLabel = "—";
  let statusColor = "text-fog/60";
  if (entry.feedbackStatus === "DONE") {
    statusLabel = "انجام شد";
    statusColor = "text-ember";
  } else if (entry.feedbackStatus === "NOT_DONE") {
    statusLabel = "نشد";
    statusColor = "text-stone";
  }

  return (
    <div className="px-3 py-3 rounded-xl bg-black/[0.035] hover:bg-black/[0.055] transition-colors">
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <p className="text-[10px] text-fog fa-num">
          {entry.weekdayLabel}،{" "}{entry.dateLabel}
        </p>
        <span className={`text-[10px] shrink-0 ${statusColor}`}>{statusLabel}</span>
      </div>
      <p className="text-xs text-stone leading-relaxed line-clamp-2">{entry.content}</p>
    </div>
  );
}
