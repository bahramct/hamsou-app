"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FreezePill — trigger کوچک برای فریز کردن مسیر (DECISION-083)
// در بالای EntryForm نشان داده می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { FreezeModal } from "./FreezeModal";

export function FreezePill() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-black/3 px-3 py-1 text-[11px] text-fog transition-colors hover:bg-sky-50 hover:border-sky-200/70 hover:text-sky-600"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="6" y="4" width="4" height="16" rx="1.5" fill="currentColor" />
          <rect x="14" y="4" width="4" height="16" rx="1.5" fill="currentColor" />
        </svg>
        فریز کردن مسیر
      </button>

      {open && <FreezeModal onClose={() => setOpen(false)} />}
    </>
  );
}
