// ─────────────────────────────────────────────────────────────────────────────
// نشان‌های تیکت (وضعیت/اولویت/دسته) — مشترک بین سمت کاربر و ادمین (DECISION-044)
// رنگ‌ها از تونِ کاتالوگ (src/lib/support/tickets.ts) می‌آیند.
// ─────────────────────────────────────────────────────────────────────────────

import { Statuses, Priorities, Categories, type Tone } from "@/lib/support/tickets";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-black/6 text-stone",
  info: "bg-mist/20 text-mist",
  warn: "bg-gold/15 text-gold",
  danger: "bg-ember/12 text-ember",
  success: "bg-sage/15 text-sage-deep",
};

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full ${TONE_CLASS[tone]}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge label={Statuses.label(status)} tone={Statuses.tone(status)} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge label={Priorities.label(priority)} tone={Priorities.tone(priority)} />;
}

export function CategoryLabel({ category }: { category: string }) {
  return <span className="text-[11px] text-fog">{Categories.label(category)}</span>;
}
