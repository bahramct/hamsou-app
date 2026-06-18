// ─────────────────────────────────────────────────────────────────────────────
// bodies.tsx — بدنه‌ی هر صفحهٔ CMS + dispatcher مشترک (DECISION-066)
// CmsPageView هم در صفحهٔ زنده و هم در پیش‌نمایشِ پنل استفاده می‌شود → یک منبعِ واحد
// (هم‌ترازی). صفحاتِ ساده از PageRenderer؛ حریم از PrivacyBody (چیدمانِ دوستونه + TOC).
// ─────────────────────────────────────────────────────────────────────────────

import { getSectionDef } from "@/lib/cms/registry";
import { createAccessor } from "@/lib/cms/accessor";
import { toFaDigits } from "@/lib/utils/digits";
import { CmsPageShell } from "./CmsPageShell";
import { PageRenderer } from "./PageRenderer";
import { PRIVACY_HERO_TYPES } from "./sections/privacy";
import type { SectionInstance } from "@/lib/cms/types";

// نگاشتِ pageKey به مسیرِ واقعی — برای returnUrl بعد از لاگین
const PAGE_PATHS: Record<string, string> = {
  landing: "/",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
  story: "/story",
};

// ─── dispatcher: chrome + بدنهٔ مخصوصِ هر صفحه ──────────────────────────────
export function CmsPageView({ pageKey, sections }: { pageKey: string; sections: SectionInstance[] }) {
  const returnPath = PAGE_PATHS[pageKey] ?? `/${pageKey}`;

  if (pageKey === "landing") {
    return (
      <CmsPageShell landing blobCount={4} returnPath={returnPath}>
        <PageRenderer sections={sections} />
      </CmsPageShell>
    );
  }
  if (pageKey === "privacy") {
    return (
      <CmsPageShell blobOpacity={0.45} blobCount={2} returnPath={returnPath}>
        <PrivacyBody sections={sections} />
      </CmsPageShell>
    );
  }
  const op = pageKey === "story" ? 0.4 : pageKey === "contact" ? 0.55 : 0.6;
  return (
    <CmsPageShell blobOpacity={op} returnPath={returnPath}>
      <PageRenderer sections={sections} />
    </CmsPageShell>
  );
}

// ─── بدنهٔ حریم خصوصی — دو ستون با فهرستِ مطالب ──────────────────────────────
function PrivacyBody({ sections }: { sections: SectionInstance[] }) {
  const heroes = sections.filter((s) => PRIVACY_HERO_TYPES.includes(s.type));
  const content = sections.filter((s) => !PRIVACY_HERO_TYPES.includes(s.type));

  const toc = content.map((s, i) => {
    const def = getSectionDef(s.type);
    const title = def ? createAccessor(def, s.content).text("navTitle") : "";
    return { id: `sec-${i + 1}`, n: i + 1, title };
  });

  return (
    <>
      {/* HERO تمام‌عرض */}
      {heroes.map((s, i) => {
        const def = getSectionDef(s.type);
        if (!def) return null;
        const Comp = def.Component;
        return <Comp key={s.id ?? `h-${i}`} c={createAccessor(def, s.content)} />;
      })}

      <hr className="hr-line mx-6 lg:mx-10 relative z-10" />

      <section className="relative z-10 py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
            {/* فهرست مطالب — sticky */}
            <aside className="lg:w-56 shrink-0">
              <div className="lg:sticky" style={{ top: "5.5rem" }}>
                <div className="text-fog text-xs uppercase tracking-[0.18em] mb-4" style={{ fontWeight: 600 }}>فهرست</div>
                <nav className="space-y-1">
                  {toc.map((t) => (
                    <a key={t.id} href={`#${t.id}`} className="flex items-center gap-3 py-2 group" style={{ textDecoration: "none" }}>
                      <span className="shrink-0" style={{ width: "20px", height: "20px", borderRadius: "6px", background: "rgba(122,132,113,0.08)", border: "1px solid rgba(122,132,113,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "var(--color-sage)", fontWeight: 400, flexShrink: 0 }}>
                        {toFaDigits(t.n)}
                      </span>
                      <span className="text-stone group-hover:text-ink transition-colors" style={{ fontWeight: 300, fontSize: "13px", lineHeight: 1.5 }}>{t.title}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* محتوای اصلی */}
            <div className="flex-1 min-w-0 space-y-16">
              {content.map((s, i) => {
                const def = getSectionDef(s.type);
                if (!def) return null;
                const c = createAccessor(def, s.content);
                const Comp = def.Component;
                return (
                  <div key={s.id ?? `c-${i}`} id={`sec-${i + 1}`} className="reveal scroll-mt-24">
                    <SectionHeading num={toFaDigits(i + 1)} title={c.text("navTitle")} />
                    <Comp c={c} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 pb-8" />
    </>
  );
}

function SectionHeading({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(122,132,113,0.09)", border: "1px solid rgba(122,132,113,0.16)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "var(--color-sage-deep)", fontWeight: 400, flexShrink: 0 }}>
        {num}
      </span>
      <h2 style={{ fontWeight: 300, fontSize: "clamp(18px, 2vw, 24px)", color: "var(--color-ink)", letterSpacing: "-0.01em" }}>{title}</h2>
    </div>
  );
}
