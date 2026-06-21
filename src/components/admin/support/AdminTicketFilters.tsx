"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminTicketFilters — فیلترهای زنده تیکت‌ها (بدون دکمه فیلتر — هر تغییر فوری اعمال می‌شود)
// ─────────────────────────────────────────────────────────────────────────────

import { useRouter, usePathname } from "next/navigation";
import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from "@/lib/support/tickets";

interface Props {
  statusF: string;
  priorityF: string;
  categoryF: string;
  q: string;
}

export function AdminTicketFilters({ statusF, priorityF, categoryF, q }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(patch: Partial<Props>) {
    const next = { statusF, priorityF, categoryF, q, ...patch };
    const params = new URLSearchParams();
    if (next.statusF) params.set("status", next.statusF);
    if (next.priorityF) params.set("priority", next.priorityF);
    if (next.categoryF) params.set("category", next.categoryF);
    if (next.q) params.set("q", next.q);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Labeled label="وضعیت">
        <select
          value={statusF}
          onChange={(e) => navigate({ statusF: e.target.value })}
          className={ctrl}
        >
          <option value="">همه</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </Labeled>

      <Labeled label="اولویت">
        <select
          value={priorityF}
          onChange={(e) => navigate({ priorityF: e.target.value })}
          className={ctrl}
        >
          <option value="">همه</option>
          {TICKET_PRIORITIES.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </Labeled>

      <Labeled label="دسته">
        <select
          value={categoryF}
          onChange={(e) => navigate({ categoryF: e.target.value })}
          className={ctrl}
        >
          <option value="">همه</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </Labeled>

      <Labeled label="جستجوی موضوع">
        <input
          defaultValue={q}
          placeholder="موضوع…"
          className={ctrl}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate({ q: (e.target as HTMLInputElement).value.trim() });
          }}
          onBlur={(e) => navigate({ q: e.target.value.trim() })}
        />
      </Labeled>
    </div>
  );
}

const ctrl =
  "w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink focus:outline-none focus:border-sage";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-stone">{label}</label>
      {children}
    </div>
  );
}
