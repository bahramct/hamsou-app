// ─────────────────────────────────────────────────────────────────────────────
// AppShell — قالبِ مشترکِ صفحاتِ احرازهویت‌شده (UI refactor، DECISION-051)
//
// میدانِ اتمسفر (AmbientField) زیرِ همه‌چیز + AppNav + لایه‌بندیِ z. صفحات فقط
// محتوای خود را به‌عنوان children می‌دهند (کانتینر/فاصله‌گذاریِ خودشان را نگه می‌دارند).
// فلسفه: یک canvasِ زنده و آرام برای کلِ اپ — عمق و اتمسفر، نه شلوغی.
//
// بدون "use client" و بدون APIِ سرور → در صفحاتِ سرور و کلاینت هر دو قابل‌استفاده.
// ─────────────────────────────────────────────────────────────────────────────

import { AppNav } from "@/components/layout/AppNav";
import { AmbientField } from "@/components/layout/AmbientField";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh flex flex-col">
      {/* اتمسفرِ نرمِ پس‌زمینه — fixed، زیرِ همه‌چیز */}
      <AmbientField />

      {/* pb موبایل = فضای نوارِ تبِ پایین (DECISION-118) تا محتوای هیچ صفحه‌ای
          زیرِ تبِ fixed پنهان نشود؛ روی دسکتاپ (md+) تبِ پایین نیست → pb صفر. */}
      <div className="relative z-10 flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <AppNav />
        {children}
      </div>
    </main>
  );
}
