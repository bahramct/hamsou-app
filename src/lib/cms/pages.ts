// ─────────────────────────────────────────────────────────────────────────────
// pages.ts — پیکربندیِ صفحاتِ تحتِ کنترلِ CMS (DECISION-066)
// هر صفحه: کلید، برچسب، مسیرِ عمومی، و ترتیبِ پیش‌فرضِ سکشن‌ها (= منبعِ حقیقتِ
// رندرِ اولیه وقتی هیچ‌چیز منتشر/ویرایش نشده). فاز ۲ فقط «about» را فعال دارد؛
// بقیه پس از تأییدِ اثبات افزوده می‌شوند.
// ─────────────────────────────────────────────────────────────────────────────

export interface PageConfig {
  key: string;
  label: string;
  path: string;
  /** ترتیبِ پیش‌فرضِ typeها — منبعِ حقیقتِ رندرِ fallback. */
  defaultSectionTypes: string[];
  /** آیا CMS برای این صفحه فعال است؟ (صفحاتِ آینده false تا آماده شوند) */
  enabled: boolean;
}

export const CMS_PAGES: PageConfig[] = [
  {
    key: "landing",
    label: "صفحهٔ اصلی (لندینگ)",
    path: "/",
    defaultSectionTypes: [
      "landing-hero",
      "landing-manifesto",
      "landing-problem",
      "landing-solution",
      "landing-difference",
      "landing-testimonial",
      "landing-final-cta",
    ],
    enabled: true,
  },
  {
    key: "about",
    label: "درباره ما",
    path: "/about",
    defaultSectionTypes: [
      "about-hero",
      "about-story-teaser",
      "about-why",
      "about-principles",
      "about-not-list",
      "about-manifesto",
      "about-cta",
    ],
    enabled: true,
  },
  {
    key: "story",
    label: "داستان همسو",
    path: "/story",
    defaultSectionTypes: [
      "story-hero",
      "story-lede",
      "story-prose-1",
      "story-quote-1",
      "story-prose-2",
      "story-ornament",
      "story-prose-3",
      "story-quote-2",
      "story-prose-4",
      "story-ornament",
      "story-prose-5",
      "story-closing",
      "story-cta",
    ],
    enabled: true,
  },
  {
    key: "contact",
    label: "تماس با ما",
    path: "/contact",
    defaultSectionTypes: ["contact-hero", "contact-card", "contact-existing"],
    enabled: true,
  },
  {
    key: "privacy",
    label: "حریم خصوصی",
    path: "/privacy",
    defaultSectionTypes: [
      "privacy-hero",
      "privacy-commitment",
      "privacy-data-collected",
      "privacy-data-use",
      "privacy-data-sharing",
      "privacy-security",
      "privacy-rights",
      "privacy-contact",
    ],
    enabled: true,
  },
];

const PAGE_BY_KEY = new Map(CMS_PAGES.map((p) => [p.key, p]));

export function getPageConfig(key: string): PageConfig | undefined {
  return PAGE_BY_KEY.get(key);
}

/** صفحاتِ فعالِ CMS (برای فهرستِ پنل). */
export function enabledPages(): PageConfig[] {
  return CMS_PAGES.filter((p) => p.enabled);
}
