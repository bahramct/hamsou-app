// ─────────────────────────────────────────────────────────────────────────────
// accessor.ts — ساختِ ContentAccessor با ادغامِ override روی پیش‌فرضِ تعریف (DECISION-066)
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ContentAccessor,
  CtaValue,
  FieldDef,
  SectionContent,
  SectionDef,
} from "./types";

/** accessor برای یک سکشن می‌سازد: مقدارِ override → پیش‌فرضِ تعریف. */
export function createAccessor(def: SectionDef, content: SectionContent | null): ContentAccessor {
  const fields = content?.fields ?? {};
  const styles = content?.styles ?? {};
  const fieldByKey = new Map<string, FieldDef>(def.fields.map((f) => [f.key, f]));

  function rawValue(key: string): unknown {
    return key in fields && fields[key] !== undefined && fields[key] !== null
      ? fields[key]
      : def.defaults[key];
  }

  return {
    text(key) {
      const v = rawValue(key);
      return typeof v === "string" ? v : v == null ? "" : String(v);
    },
    list(key) {
      const v = rawValue(key);
      return Array.isArray(v) ? v.map((x) => String(x)) : [];
    },
    img(key) {
      const v = rawValue(key);
      return typeof v === "string" && v ? v : null;
    },
    cta(key) {
      const v = rawValue(key) as Partial<CtaValue> | undefined;
      return { label: v?.label ?? "", href: v?.href ?? "#" };
    },
    fontSize(key) {
      const override = styles[key]?.fontSize;
      if (override) return override;
      const defStyle = def.defaultStyles?.[key]?.fontSize;
      if (defStyle) return defStyle;
      return fieldByKey.get(key)?.defaultFontSize;
    },
  };
}
