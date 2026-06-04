"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GenerateReportButton — دکمه تولید گزارش هفته گذشته
// POST /api/reports/weekly → router.refresh() تا Server Component داده جدید بخواند
//
// قاعدهٔ نوتیفیکیشن (DECISION-046/053): متنِ دکمه هرگز عوض نمی‌شود؛ حینِ کار فقط
// spinner نشان داده می‌شود و نتیجه با toast اعلام می‌گردد.
// تولید فقط با کلیک کاربر رخ می‌دهد — هیچ گزارشی خودکار به AI نمی‌رود.
// ─────────────────────────────────────────────────────────────────────────────

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";

interface Props {
  weekStartIso?: string;
  totalEntries: number;
}

export function GenerateReportButton({ weekStartIso, totalEntries }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/reports/weekly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(weekStartIso ? { weekStart: weekStartIso } : {}),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          toast.error(data.message ?? "خطا در تولید گزارش");
          return;
        }
        toast.success("گزارش هفتگی ساخته شد");
        router.refresh();
      } catch {
        toast.error("ارتباط با سرور برقرار نشد");
      }
    });
  };

  if (totalEntries === 0) {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm text-stone leading-loose">
          این هفته تعهدی ثبت نشده. گزارشی برای ساختن نیست.
        </p>
        <p className="text-xs text-fog">
          هر زمان تعهدی ثبت کنی، اینجا گزارش هفتگی آماده خواهد بود.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium bg-ink text-paper hover:bg-charcoal active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-wait"
    >
      {isPending && <Spinner />}
      تولید گزارش
    </button>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
