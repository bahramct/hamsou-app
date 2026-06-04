// ─────────────────────────────────────────────────────────────────────────────
// DevModeBadge — نشانگر بصری گوشه صفحه که نشان می‌دهد اپ در حالت dev است.
//
// در حالت production هیچ‌چیز رندر نمی‌شود (DevOnly آن را پنهان می‌کند).
// طراحی: کوچک، گوشه پایین-چپ، نیمه‌شفاف، غیرمزاحم.
//
// لایه ۴ از معماری Dev/Prod (CLAUDE.md §۱۳).
// ─────────────────────────────────────────────────────────────────────────────

import { DevOnly } from "@/components/dev/DevOnly";

export function DevModeBadge() {
  return (
    <DevOnly>
      <div
        aria-hidden="true"
        className="
          fixed bottom-3 left-3 z-50 select-none
          px-2 py-0.5 rounded-md
          bg-ember/90 text-paper text-[10px] font-semibold tracking-wider
          shadow-paper-sm
          pointer-events-none
        "
        dir="ltr"
      >
        DEV
      </div>
    </DevOnly>
  );
}
