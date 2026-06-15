// ─────────────────────────────────────────────────────────────────────────────
// GoalTypeBadge — بَجِ «هدف» / «چالش» (TASK-28 فاز ۲)
// هدف = sage (آرام، بلندمدت‌تر) · چالش = ember (تیز، کوتاه). الگو از mockups/goal-journey.html.
// تنها نمایش — منطقِ نوع از SerializedGoal.type می‌آید. در هدر، تایلِ داشبورد و تاریخچه بازاستفاده می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import type { GoalType } from "@/types/goal";

function GoalIcon({ size = 12 }: { size?: number }) {
  // جوانه/برگ — رشد آرام
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21v-8M12 13c0-4 3-7 8-7-.2 4-3 7-8 7Zm0 1c0-4.4-3-7.5-8-7.5C4.2 11 7 14 12 14Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChallengeIcon({ size = 12 }: { size?: number }) {
  // آذرخش — حرکتِ کوتاه و تیز
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function GoalTypeBadge({
  type,
  size = "md",
  className = "",
}: {
  type: GoalType;
  size?: "sm" | "md";
  className?: string;
}) {
  const isChallenge = type === "challenge";
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px] gap-1" : "px-2.5 py-1 text-[11px] gap-1.5";
  const tone = isChallenge
    ? "text-ember bg-ember/12 border-ember/25"
    : "text-sage-deep bg-sage/15 border-sage/30";

  return (
    <span
      className={`inline-flex items-center self-start rounded-full border font-semibold fa-num ${pad} ${tone} ${className}`}
    >
      {isChallenge ? <ChallengeIcon size={size === "sm" ? 10 : 12} /> : <GoalIcon size={size === "sm" ? 10 : 12} />}
      {isChallenge ? "چالش" : "هدف"}
    </span>
  );
}
