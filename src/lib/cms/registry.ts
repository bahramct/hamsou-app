// ─────────────────────────────────────────────────────────────────────────────
// registry.ts — رجیستریِ انواعِ سکشن (DECISION-066)
// افزودن نوعِ جدید = یک ردیف به آرایهٔ مربوطه + ثبت اینجا. بدون migration.
// (الگوی AI Registry: نقش‌ها همگن نیستند، هر نوع فیلد/کامپوننتِ خود را دارد.)
// ─────────────────────────────────────────────────────────────────────────────

import type { SectionDef } from "./types";
import { ABOUT_SECTIONS } from "@/components/cms/sections/about";
import { LANDING_SECTIONS } from "@/components/cms/sections/landing";
import { STORY_SECTIONS } from "@/components/cms/sections/story";
import { CONTACT_SECTIONS } from "@/components/cms/sections/contact";
import { PRIVACY_SECTIONS } from "@/components/cms/sections/privacy";

// همهٔ سکشن‌های ثبت‌شدهٔ همهٔ صفحات.
const ALL_DEFS: SectionDef[] = [
  ...ABOUT_SECTIONS,
  ...LANDING_SECTIONS,
  ...STORY_SECTIONS,
  ...CONTACT_SECTIONS,
  ...PRIVACY_SECTIONS,
];

const BY_TYPE = new Map<string, SectionDef>(ALL_DEFS.map((d) => [d.type, d]));

/** تعریفِ یک نوعِ سکشن بر اساسِ کلید (یا undefined اگر ناشناخته). */
export function getSectionDef(type: string): SectionDef | undefined {
  return BY_TYPE.get(type);
}

/** انواعِ سکشنی که در یک صفحه قابلِ استفاده‌اند (برای منوی «افزودن سکشن»). */
export function getSectionTypesForPage(pageKey: string): SectionDef[] {
  return ALL_DEFS.filter((d) => d.pages === "any" || d.pages.includes(pageKey));
}

/** همهٔ تعریف‌ها. */
export function allSectionDefs(): SectionDef[] {
  return ALL_DEFS;
}
