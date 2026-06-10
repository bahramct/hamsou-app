// ─────────────────────────────────────────────────────────────────────────────
// types.ts — انواعِ پایهٔ CMS سکشن‌ها (DECISION-066)
// مدلِ Override: کد=طراحی+پیش‌فرض، DB=override. هر نوعِ سکشن یک تعریف در رجیستری دارد.
// ─────────────────────────────────────────────────────────────────────────────

import type React from "react";

/** انواعِ فیلدِ قابلِ ویرایش در پنل. */
export type FieldType =
  | "text" // یک‌خطی
  | "textarea" // چندخطی
  | "list" // فهرستِ رشته‌ها
  | "image" // base64/URL
  | "cta"; // دکمه: { label, href }

/** آیا این نوعِ فیلد، override اندازهٔ فونت می‌پذیرد؟ */
export const FONT_SIZABLE: FieldType[] = ["text", "textarea"];

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  /** اندازهٔ فونتِ پیش‌فرض (مثل "clamp(40px,6vw,80px)") — قابلِ override در پنل. */
  defaultFontSize?: string;
  /** راهنمای کوتاه زیرِ فیلد در پنل. */
  hint?: string;
  /** برای list: برچسبِ هر آیتم. */
  itemLabel?: string;
}

/** مقدارِ یک CTA. */
export interface CtaValue {
  label: string;
  href: string;
}

/** override سبک per فیلد (فعلاً فقط اندازهٔ فونت — قابلِ گسترش). */
export interface FieldStyle {
  fontSize?: string;
}

/** محتوای ذخیره‌شدهٔ یک نمونهٔ سکشن (JSON در DB). */
export interface SectionContent {
  fields: Record<string, unknown>;
  styles?: Record<string, FieldStyle>;
}

/** props که به کامپوننتِ رندرِ هر سکشن داده می‌شود. */
export interface SectionRenderProps {
  c: ContentAccessor;
}

/** تعریفِ یک نوعِ سکشن در رجیستری. */
export interface SectionDef {
  type: string;
  label: string; // برچسبِ فارسی برای پنل
  description?: string;
  /** کدام صفحات اجازهٔ این نوع را دارند؛ "any" = همه. */
  pages: string[] | "any";
  fields: FieldDef[];
  /** مقادیرِ پیش‌فرضِ فیلدها (منبعِ حقیقتِ محتوای اولیه). */
  defaults: Record<string, unknown>;
  /** سبک‌های پیش‌فرض per فیلد (مثلاً اندازهٔ فونتِ ثابت). */
  defaultStyles?: Record<string, FieldStyle>;
  Component: React.FC<SectionRenderProps>;
}

/** یک نمونهٔ سکشن (draft یا published). */
export interface SectionInstance {
  id?: string;
  type: string;
  isVisible: boolean;
  content: SectionContent;
}

/** دسترسیِ ادغام‌شده به محتوای یک سکشن (override روی پیش‌فرض). */
export interface ContentAccessor {
  /** متنِ یک فیلد (override یا پیش‌فرض). */
  text(key: string): string;
  /** فهرستِ یک فیلدِ list. */
  list(key: string): string[];
  /** تصویرِ یک فیلدِ image (null اگر نبود). */
  img(key: string): string | null;
  /** CTA یک فیلد. */
  cta(key: string): CtaValue;
  /** اندازهٔ فونتِ resolve‌شده (override → سبکِ پیش‌فرض → defaultFontSize → undefined). */
  fontSize(key: string): string | undefined;
}
