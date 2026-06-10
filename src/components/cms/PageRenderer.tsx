// ─────────────────────────────────────────────────────────────────────────────
// PageRenderer — رندرِ آرایه‌ای از سکشن‌ها (DECISION-066)
// هر سکشن با accessorِ خودش (override روی پیش‌فرض) رندر می‌شود. Server Component.
// سکشن‌هایی با typeِ ناشناخته بی‌صدا رد می‌شوند (مقاوم در برابرِ تغییرِ رجیستری).
// ─────────────────────────────────────────────────────────────────────────────

import { getSectionDef } from "@/lib/cms/registry";
import { createAccessor } from "@/lib/cms/accessor";
import type { SectionInstance } from "@/lib/cms/types";

export function PageRenderer({ sections }: { sections: SectionInstance[] }) {
  return (
    <>
      {sections.map((s, i) => {
        const def = getSectionDef(s.type);
        if (!def) return null;
        const c = createAccessor(def, s.content);
        const Comp = def.Component;
        return <Comp key={s.id ?? `${s.type}-${i}`} c={c} />;
      })}
    </>
  );
}
