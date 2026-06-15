"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SupportSection — کارت تیکت‌های پشتیبانی در پروفایل (DECISION-091)
// چت آنلاین از این کارت حذف شد — دسترسی از FAB جهانی (FloatingActions)
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";

interface Props {
  ticketingAllowed: boolean;
}

export function SupportSection({ ticketingAllowed }: Props) {
  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center shrink-0 text-stone mt-0.5">
            <TicketIcon />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-ink">تیکت‌های پشتیبانی</h2>
            <p className="text-xs text-fog leading-relaxed">
              سؤال یا مشکلی داری؟ تیکت بفرست و گفتگو را همان‌جا پیگیری کن.
            </p>
          </div>
        </div>
        {ticketingAllowed ? (
          <Link
            href="/support"
            className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
          >
            تیکت‌های پشتیبانی
          </Link>
        ) : (
          <button
            disabled
            className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-black/8 text-fog text-sm font-medium cursor-not-allowed"
          >
            تیکت‌های پشتیبانی
          </button>
        )}
      </div>
    </section>
  );
}

function TicketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6M15 3h6m0 0v6m0-6L10 14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
