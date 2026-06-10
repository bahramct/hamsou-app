// ─────────────────────────────────────────────────────────────────────────────
// CmsPageShell — قابِ مشترکِ صفحاتِ CMS (DECISION-066)
// chrome (grain + بلوب‌ها + Nav + Footer) یک منبعِ واحد دارد تا صفحهٔ زنده و
// پیش‌نمایشِ پنل دقیقاً یکسان رندر شوند (هم‌ترازی). پارامترها برای تفاوت‌های جزئیِ
// هر صفحه: تعدادِ بلوب، شفافیت، و حالتِ navِ لندینگ (#anchor در همان صفحه).
// ─────────────────────────────────────────────────────────────────────────────

import { LandingEffects } from "@/components/features/landing/LandingEffects";
import { LandingNav } from "@/components/layout/LandingNav";
import { LandingFooter } from "@/components/layout/LandingFooter";

export function CmsPageShell({
  children,
  blobOpacity = 0.6,
  blobCount = 3,
  landing = false,
}: {
  children: React.ReactNode;
  blobOpacity?: number;
  blobCount?: number;
  landing?: boolean;
}) {
  return (
    <main className="grain">
      <LandingEffects />
      <div className="bg-stage" style={landing ? undefined : { opacity: blobOpacity }}>
        {Array.from({ length: blobCount }, (_, i) => (
          <div key={i} className={`blob blob-${i + 1}`} />
        ))}
      </div>
      <LandingNav landing={landing} />
      {children}
      <LandingFooter />
    </main>
  );
}
