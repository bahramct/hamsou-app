// ─────────────────────────────────────────────────────────────────────────────
// /onboarding — حالتِ بارگذاری (DECISION-087/088)
// به‌جای صفحهٔ خالی/نیمه‌رندر هنگامِ آماده‌سازیِ سرور یا کامپایلِ مسیر در dev،
// یک نشانگرِ آرام روی پس‌زمینهٔ تمیزِ Notion‑طور نشان می‌دهد.
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";

export default function OnboardingLoading() {
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-5 bg-paper">
      <div className="relative z-10 flex flex-col items-center gap-5">
        <Image src="/logo.png" alt="همسو" width={44} height={44} className="opacity-90" priority />
        <span className="inline-block w-7 h-7 border-2 border-sage border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-stone">در حال آماده‌سازی…</p>
      </div>
    </main>
  );
}
