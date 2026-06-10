// ─────────────────────────────────────────────────────────────────────────────
// queries.ts — خواندنِ محتوای صفحات (DECISION-066). فقط سرور.
// قاعدهٔ هم‌ترازی:
//   سایتِ زنده → getPageForSite: عکسِ منتشرشده (PageContent) → اگر نبود، پیش‌فرضِ کد.
//   پیش‌نمایشِ پنل → getPageForPreview: پیش‌نویس (PageSection) → اگر نبود، پیش‌فرضِ کد.
// در هر دو حالت، نبودِ داده = رندرِ دقیقاً مثلِ نسخهٔ دست‌سازِ قبلی.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { getPageConfig } from "./pages";
import { getSectionDef } from "./registry";
import type { SectionContent, SectionInstance } from "./types";

/** نمونه‌های پیش‌فرضِ یک صفحه از پیکربندی + رجیستری (محتوای خالی = استفاده از defaults). */
export function getDefaultSections(pageKey: string): SectionInstance[] {
  const cfg = getPageConfig(pageKey);
  if (!cfg) return [];
  return cfg.defaultSectionTypes
    .filter((t) => getSectionDef(t))
    .map((type) => ({ type, isVisible: true, content: { fields: {}, styles: {} } }));
}

/** فقط نمونه‌هایی که نوعشان در رجیستری شناخته‌شده است (در برابرِ typeِ حذف‌شده مقاوم). */
function keepKnown(instances: SectionInstance[]): SectionInstance[] {
  return instances.filter((s) => getSectionDef(s.type));
}

function parseContent(json: string): SectionContent {
  try {
    const v = JSON.parse(json) as Partial<SectionContent>;
    return { fields: v.fields ?? {}, styles: v.styles ?? {} };
  } catch {
    return { fields: {}, styles: {} };
  }
}

/** سکشن‌های منتشرشدهٔ یک صفحه (یا null اگر هرگز منتشر نشده). */
export async function getPublishedSections(pageKey: string): Promise<SectionInstance[] | null> {
  const row = await prisma.pageContent.findUnique({ where: { pageKey } });
  if (!row) return null;
  try {
    const arr = JSON.parse(row.publishedJson) as Array<{ type: string; isVisible: boolean; content: SectionContent }>;
    return keepKnown(
      arr.map((s) => ({
        type: s.type,
        isVisible: s.isVisible !== false,
        content: { fields: s.content?.fields ?? {}, styles: s.content?.styles ?? {} },
      }))
    );
  } catch {
    return null;
  }
}

/** سکشن‌های پیش‌نویسِ یک صفحه (ردیف‌های PageSection به ترتیب)؛ خالی = هرگز ویرایش نشده. */
export async function getDraftSections(pageKey: string): Promise<SectionInstance[]> {
  const rows = await prisma.pageSection.findMany({
    where: { pageKey },
    orderBy: { order: "asc" },
  });
  return keepKnown(
    rows.map((r) => ({
      id: r.id,
      type: r.type,
      isVisible: r.isVisible,
      content: parseContent(r.content),
    }))
  );
}

/** سایتِ زنده: منتشرشده → fallback پیش‌فرضِ کد. فقط visibleها. */
export async function getPageForSite(pageKey: string): Promise<SectionInstance[]> {
  const published = await getPublishedSections(pageKey);
  const base = published ?? getDefaultSections(pageKey);
  return base.filter((s) => s.isVisible);
}

/** پیش‌نمایشِ پنل: پیش‌نویس → fallback پیش‌فرضِ کد. فقط visibleها (مثلِ سایت). */
export async function getPageForPreview(pageKey: string): Promise<SectionInstance[]> {
  const draft = await getDraftSections(pageKey);
  const base = draft.length > 0 ? draft : getDefaultSections(pageKey);
  return base.filter((s) => s.isVisible);
}
