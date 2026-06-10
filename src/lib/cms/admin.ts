// ─────────────────────────────────────────────────────────────────────────────
// admin.ts — کمک‌توابعِ سمتِ پنل برای CMS (DECISION-066). فقط سرور.
// استخراجِ schema (بدونِ کامپوننتِ React) برای ارسال به کلاینت + اعتبارسنجیِ ورودی.
// ─────────────────────────────────────────────────────────────────────────────

import type { FieldDef, SectionContent, SectionInstance } from "./types";
import { getSectionDef, getSectionTypesForPage } from "./registry";

/** schemaِ یک نوعِ سکشن برای کلاینت (فیلدها + مقادیر/سبک‌های پیش‌فرض). */
export interface SectionSchema {
  type: string;
  label: string;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  defaultStyles: Record<string, { fontSize?: string }>;
}

export function extractSchema(type: string): SectionSchema | null {
  const def = getSectionDef(type);
  if (!def) return null;
  return {
    type: def.type,
    label: def.label,
    fields: def.fields,
    defaults: def.defaults,
    defaultStyles: def.defaultStyles ?? {},
  };
}

/** schemaِ همهٔ انواعِ قابلِ‌استفاده در یک صفحه. */
export function schemasForPage(pageKey: string): SectionSchema[] {
  return getSectionTypesForPage(pageKey)
    .map((d) => extractSchema(d.type))
    .filter((s): s is SectionSchema => s !== null);
}

/** پاک‌سازیِ یک نمونهٔ سکشنِ ورودی از کلاینت (دفاعی). نوعِ ناشناخته → null. */
export function sanitizeInstance(raw: unknown): SectionInstance | null {
  const r = raw as Partial<SectionInstance> | null;
  if (!r || typeof r.type !== "string") return null;
  const def = getSectionDef(r.type);
  if (!def) return null;

  const inContent = (r.content ?? {}) as Partial<SectionContent>;
  const fieldKeys = new Set(def.fields.map((f) => f.key));

  // فقط فیلدهای شناخته‌شده نگه داشته می‌شوند
  const fields: Record<string, unknown> = {};
  const styles: Record<string, { fontSize?: string }> = {};
  for (const [k, v] of Object.entries(inContent.fields ?? {})) {
    if (fieldKeys.has(k)) fields[k] = v;
  }
  for (const [k, v] of Object.entries(inContent.styles ?? {})) {
    if (fieldKeys.has(k) && v && typeof (v as { fontSize?: unknown }).fontSize === "string") {
      styles[k] = { fontSize: (v as { fontSize: string }).fontSize };
    }
  }

  return {
    type: r.type,
    isVisible: r.isVisible !== false,
    content: { fields, styles },
  };
}

/** آرایهٔ ورودی → نمونه‌های معتبر (ترتیب حفظ می‌شود). */
export function sanitizeInstances(raw: unknown): SectionInstance[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeInstance).filter((s): s is SectionInstance => s !== null);
}

/** سریال‌سازیِ سکشن‌ها برای ذخیره در PageContent.publishedJson. */
export function serializeForPublish(sections: SectionInstance[]): string {
  return JSON.stringify(
    sections.map((s) => ({ type: s.type, isVisible: s.isVisible, content: s.content }))
  );
}
