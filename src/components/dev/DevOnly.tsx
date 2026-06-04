// ─────────────────────────────────────────────────────────────────────────────
// DevOnly — wrapper UI که children را فقط در حالت development رندر می‌کند.
//
// استفاده:
//   <DevOnly>
//     <DevOtpPanel code={code} />
//   </DevOnly>
//
// - در build production: مقدار `IS_DEV_MODE` به literal `false` تبدیل می‌شود
//   و کل این شاخه (شامل children) از bundle حذف می‌شود (tree-shaking).
// - این کامپوننت یک Server Component است (بدون "use client") تا overhead صفر باشد.
//   اگر children نیاز به interactivity داشتند، خودِ child را client بساز.
//
// لایه ۲ از معماری Dev/Prod (CLAUDE.md §۱۳).
// ─────────────────────────────────────────────────────────────────────────────

import { IS_DEV_MODE } from "@/lib/env";
import type { ReactNode } from "react";

export function DevOnly({ children }: { children: ReactNode }) {
  if (!IS_DEV_MODE) return null;
  return <>{children}</>;
}
