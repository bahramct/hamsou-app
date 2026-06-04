"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RecentHistoryModal — دکمه + modal تاریخچه اخیر در داشبورد
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import Link from "next/link";

export interface RecentEntry {
  id: string;
  content: string;
  dateLabel: string;
  weekdayLabel: string;
  feedbackStatus: "DONE" | "NOT_DONE" | null;
}

interface Props {
  entries: RecentEntry[];
}

export function RecentHistoryButton({ entries }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full
                   border border-black/10 bg-paper
                   text-xs text-stone
                   hover:border-black/20 hover:bg-black/3
                   transition-all duration-200"
      >
        <HistoryIcon />
        <span>تاریخچه اخیر</span>
      </button>

      {open && <HistoryModal entries={entries} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── modal ───────────────────────────────────────────────────────────────────

function HistoryModal({
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

  // بستن با Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

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
            background: "rgba(245,242,235,0.92)",
            backdropFilter: "blur(24px) saturate(140%)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.94)",
            transition: "opacity 220ms ease, transform 280ms cubic-bezier(0.19,1,0.22,1)",
          }}
        >
          {/* هدر */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/6">
            <h2 className="text-sm font-semibold text-ink">تاریخچه اخیر</h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="بستن"
              className="w-7 h-7 rounded-full bg-black/6 hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* لیست تعهدها */}
          <div className="px-4 py-3 space-y-2 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </div>

          {/* فوتر */}
          <div className="px-5 py-3.5 border-t border-black/6 bg-black/2.5">
            <Link
              href="/history"
              onClick={handleClose}
              className="flex items-center justify-center gap-1.5 text-xs text-stone hover:text-ink transition-colors duration-200"
            >
              مشاهده همه تاریخچه
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M8 6H4M4 6L6.5 3.5M4 6L6.5 8.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
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
    <div className="px-3 py-3 rounded-xl bg-black/3.5 hover:bg-black/5.5 transition-colors">
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

// ─── آیکون ───────────────────────────────────────────────────────────────────

function HistoryIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 7v5l3 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
