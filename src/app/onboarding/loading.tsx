// ─────────────────────────────────────────────────────────────────────────────
// /onboarding — حالتِ بارگذاری (DECISION-087)
// به‌جای صفحهٔ خالی/نیمه‌رندر هنگامِ آماده‌سازیِ سرور یا کامپایلِ مسیر در dev،
// یک نشانگرِ آرام نشان می‌دهد تا کاربر تصور نکند صفحه «قفل» شده.
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import { AmbientField } from "@/components/layout/AmbientField";

export default function OnboardingLoading() {
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-5">
      <AmbientField />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <Image src="/logo.png" alt="همسو" width={44} height={44} className="opacity-90" priority />
        <span className="inline-block w-7 h-7 border-2 border-sage border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-stone">در حال آماده‌سازی…</p>
      </div>
    </main>
  );
}
