"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DiscountManager — مدیریت کدهای تخفیف (DECISION-040)
// ساخت/ویرایش/حذف. مصرف واقعی موکول به درگاه پرداخت.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { onlyDigits } from "@/lib/utils/digits";
import { JalaliDatePicker } from "@/components/ui/JalaliDatePicker";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export interface DiscountView {
  id: string;
  code: string;
  kind: string;
  value: number;
  plans: string[];
  cycles: string[];
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  note: string | null;
  createdAt: string;
}

interface Props {
  discounts: DiscountView[];
  planKeys: string[];
  canWrite: boolean;
}

const CYCLES = [
  { key: "monthly", label: "ماهانه" },
  { key: "annual", label: "سالانه" },
];

export function DiscountManager({ discounts, planKeys, canWrite }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">کدهای تخفیف</h2>
          <p className="text-xs text-fog mt-0.5">درصدی یا مبلغی، با سقف استفاده و انقضا. کاربر در صفحهٔ پلن‌ها واردش می‌کند.</p>
        </div>
        {canWrite && !adding && editingId === null && (
          <button onClick={() => setAdding(true)} className="text-xs px-3 py-1.5 rounded-lg bg-ink text-paper hover:bg-charcoal transition-colors">+ کد جدید</button>
        )}
      </div>

      {adding && (
        <DiscountForm mode="create" planKeys={planKeys} onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
      )}

      <div className="space-y-2 mt-3">
        {discounts.length === 0 && !adding && (
          <p className="text-[11px] text-fog bg-black/3 rounded-lg px-3 py-2">هنوز کدی ساخته نشده.</p>
        )}
        {discounts.map((d) =>
          editingId === d.id ? (
            <DiscountForm key={d.id} mode="edit" discount={d} planKeys={planKeys} onDone={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
          ) : (
            <DiscountRow key={d.id} d={d} canWrite={canWrite} disabled={adding || (editingId !== null && editingId !== d.id)} onEdit={() => setEditingId(d.id)} />
          )
        )}
      </div>
    </section>
  );
}

function DiscountRow({ d, canWrite, disabled, onEdit }: { d: DiscountView; canWrite: boolean; disabled: boolean; onEdit: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`کد «${d.code}» حذف شود؟`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/plans/discounts/${d.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("کد تخفیف حذف شد"); router.refresh(); }
      else toast.error("حذف ناموفق بود");
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  const valueLabel = d.kind === "percent" ? `${d.value.toLocaleString("fa-IR")}٪` : `${d.value.toLocaleString("fa-IR")} تومان`;

  return (
    <div className={`rounded-xl border border-black/8 bg-white/50 px-4 py-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code dir="ltr" className="text-sm font-semibold text-ink num-latin">{d.code}</code>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-mist/20 text-charcoal">{valueLabel}</span>
            {!d.isActive && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ember/10 text-ember">غیرفعال</span>}
          </div>
          <div className="text-[11px] text-fog mt-1">
            {d.plans.length ? `پلن‌ها: ${d.plans.join("، ")}` : "همهٔ پلن‌ها"}
            {" · "}
            {d.cycles.length ? `دوره: ${d.cycles.map((c) => (c === "monthly" ? "ماهانه" : "سالانه")).join("، ")}` : "همهٔ دوره‌ها"}
            {d.maxUses !== null && ` · سقف: ${d.usedCount.toLocaleString("fa-IR")}/${d.maxUses.toLocaleString("fa-IR")}`}
          </div>
        </div>
        {canWrite && !disabled && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onEdit} className="text-xs text-stone hover:text-ink">ویرایش</button>
            <button onClick={remove} disabled={busy} className="text-xs text-ember hover:underline disabled:opacity-40">حذف</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DiscountForm({
  mode, discount, planKeys, onDone, onCancel,
}: {
  mode: "create" | "edit";
  discount?: DiscountView;
  planKeys: string[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState(discount?.code ?? "");
  const [kind, setKind] = useState(discount?.kind ?? "percent");
  const [value, setValue] = useState(String(discount?.value ?? ""));
  const [plans, setPlans] = useState<string[]>(discount?.plans ?? []);
  const [cycles, setCycles] = useState<string[]>(discount?.cycles ?? []);
  const [maxUses, setMaxUses] = useState(discount?.maxUses != null ? String(discount.maxUses) : "");
  const [expiresAt, setExpiresAt] = useState(discount?.expiresAt ? discount.expiresAt.slice(0, 10) : "");
  const [isActive, setIsActive] = useState(discount?.isActive ?? true);
  const [note, setNote] = useState(discount?.note ?? "");
  const [busy, setBusy] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, key: string) {
    setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  }

  async function save() {
    setBusy(true);
    const payload: Record<string, unknown> = {
      code, kind, value: Number(value) || 0,
      plans, cycles,
      maxUses: maxUses.trim() === "" ? null : Number(maxUses),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      isActive, note,
    };
    try {
      const url = mode === "create" ? "/api/admin/plans/discounts" : `/api/admin/plans/discounts/${discount!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dd = await res.json();
      if (!res.ok) { toast.error(dd.error ?? "خطا در ذخیره."); return; }
      toast.success(mode === "create" ? "کد تخفیف ساخته شد" : "کد تخفیف ذخیره شد");
      router.refresh();
      onDone();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className="rounded-xl border border-sage/40 bg-white/70 p-4 space-y-3 mb-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="کد">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} dir="ltr" placeholder="HAMSOO20" className={`${inp} num-latin`} />
        </Field>
        <Field label="نوع">
          <select value={kind} onChange={(e) => setKind(e.target.value)} dir="rtl" className={inp}>
            <option value="percent">درصدی</option>
            <option value="fixed">مبلغی (تومان)</option>
          </select>
        </Field>
        <Field label={kind === "percent" ? "درصد (۱ تا ۱۰۰)" : "مبلغ (تومان)"}>
          <input inputMode="numeric" dir="ltr" value={value} onChange={(e) => setValue(onlyDigits(e.target.value))} className={inp} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="پلن‌های مشمول (خالی = همه)">
          <div className="flex gap-3 flex-wrap pt-1">
            {planKeys.map((p) => (
              <label key={p} className="flex items-center gap-1 text-xs text-stone cursor-pointer">
                <input type="checkbox" checked={plans.includes(p)} onChange={() => toggle(plans, setPlans, p)} />
                {p}
              </label>
            ))}
          </div>
        </Field>
        <Field label="دوره‌های مشمول (خالی = همه)">
          <div className="flex gap-3 flex-wrap pt-1">
            {CYCLES.map((c) => (
              <label key={c.key} className="flex items-center gap-1 text-xs text-stone cursor-pointer">
                <input type="checkbox" checked={cycles.includes(c.key)} onChange={() => toggle(cycles, setCycles, c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="سقف استفاده (خالی = نامحدود)">
          <input inputMode="numeric" dir="ltr" value={maxUses} onChange={(e) => setMaxUses(onlyDigits(e.target.value))} className={inp} />
        </Field>
        <Field label="تاریخ انقضا (اختیاری)">
          <JalaliDatePicker value={expiresAt} onChange={setExpiresAt} placeholder="بدون انقضا" />
        </Field>
        <Field label="یادداشت (اختیاری)">
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inp} />
        </Field>
      </div>

      <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        فعال
      </label>

      <div className="flex items-center gap-2">
        <button onClick={save} disabled={busy} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-ink text-paper text-sm hover:bg-charcoal transition-colors disabled:opacity-40">
          {busy && <Spinner />}
          {mode === "create" ? "ساخت کد" : "ذخیره"}
        </button>
        <button onClick={onCancel} disabled={busy} className="px-3 py-2 rounded-lg text-sm text-stone hover:bg-black/4">انصراف</button>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-stone">{label}</label>
      {children}
    </div>
  );
}
