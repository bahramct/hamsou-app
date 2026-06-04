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

      <div className="relative z-10 flex flex-1 flex-col">
        <AppNav />
        {children}
      </div>
    </main>
  );
}
