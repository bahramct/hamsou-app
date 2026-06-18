// ─────────────────────────────────────────────────────────────────────────────
// CmsPageShell — قابِ مشترکِ صفحاتِ CMS (DECISION-066)
// chrome (grain + بلوب‌ها + Nav + Footer) یک منبعِ واحد دارد تا صفحهٔ زنده و
// پیش‌نمایشِ پنل دقیقاً یکسان رندر شوند (هم‌ترازی). پارامترها برای تفاوت‌های جزئیِ
// هر صفحه: تعدادِ بلوب، شفافیت، و حالتِ navِ لندینگ (#anchor در همان صفحه).
// ─────────────────────────────────────────────────────────────────────────────

import { LandingEffects } from "@/components/features/landing/LandingEffects";
import { LandingNavServer } from "@/components/layout/LandingNavServer";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { PublicPageTracker } from "@/components/system/PublicPageTracker";

export function CmsPageShell({
  children,
  blobOpacity = 0.6,
  blobCount = 3,
  landing = false,
  returnPath,
}: {
  children: React.ReactNode;
  blobOpacity?: number;
  blobCount?: number;
  landing?: boolean;
  returnPath?: string;
}) {
  return (
    <main className="grain">
      <LandingEffects />
      <div className="bg-stage" style={landing ? undefined : { opacity: blobOpacity }}>
        {Array.from({ length: blobCount }, (_, i) => (
          <div key={i} className={`blob blob-${i + 1}`} />
        ))}
      </div>
      <PublicPageTracker />
      <LandingNavServer landing={landing} returnPath={returnPath} />
      {children}
      <LandingFooter />
    </main>
  );
}
