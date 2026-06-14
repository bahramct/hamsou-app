"use client";

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingBuilder — سازندهٔ کاملِ اسلایدهای onboarding در پنل (DECISION-089)
//
// افزودن/حذف/جابجاییِ اسلایدهای روایی + ویرایشِ همهٔ متن‌ها + اسلایدهای کارکردیِ
// نام/انگیزه (حداکثر یکی) + اسلایدِ پایانی (همیشه آخر، حذف‌ناپذیر).
//
// نکته: فقط `import type` از config (که در build حذف می‌شود) تا prisma واردِ بسته client نشود.
// `ONBOARDING_MOTIVES` از motives.ts پاک است (بدونِ importِ سرور) و امن.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  OnboardingSlide,
  NarrativeSlide,
  NameSlide,
  MotiveSlide,
  FinalSlide,
} from "@/lib/onboarding/config";
import { ONBOARDING_MOTIVES } from "@/lib/onboarding/motives";

const TYPE_LABEL: Record<OnboardingSlide["type"], string> = {
  narrative: "روایی",
  name: "نامِ کاربر",
  motive: "پرسشِ انگیزه",
  final: "پایانی",
};

const genId = () => "s_" + Math.random().toString(36).slice(2, 10);

function makeSlide(type: "narrative" | "name" | "motive"): OnboardingSlide {
  if (type === "narrative")
    return { id: genId(), type: "narrative", title: "", body: "", footnote: "", buttonText: "ادامه" };
  if (type === "name")
    return {
      id: genId(),
      type: "name",
      title: "تو را چه صدا کنیم؟",
      subtitle: "اسمی که دوست داری در همسو با آن خطابت کنیم.",
      placeholder: "نام تو",
      buttonText: "ادامه",
    };
  return {
    id: genId(),
    type: "motive",
    title: "چه چیزی تو را به همسو آورد؟",
    subtitle: "",
    options: ONBOARDING_MOTIVES.map((m) => ({ slug: m.slug, label: m.label })),
    buttonText: "ادامه",
  };
}

export function OnboardingBuilder({
  slides,
  onChange,
  disabled,
}: {
  slides: OnboardingSlide[];
  onChange: (slides: OnboardingSlide[]) => void;
  disabled: boolean;
}) {
  // final همیشه جدا و آخر است؛ بقیه قابلِ جابجایی/حذف‌اند.
  const editable = slides.filter((s) => s.type !== "final");
  const final = (slides.find((s) => s.type === "final") as FinalSlide | undefined) ?? null;
  const hasName = editable.some((s) => s.type === "name");
  const hasMotive = editable.some((s) => s.type === "motive");

  function commit(nextEditable: OnboardingSlide[]) {
    onChange(final ? [...nextEditable, final] : nextEditable);
  }

  function updateAt(index: number, patch: Partial<OnboardingSlide>) {
    const next = editable.map((s, i) => (i === index ? ({ ...s, ...patch } as OnboardingSlide) : s));
    commit(next);
  }
  function updateFinal(patch: Partial<FinalSlide>) {
    if (!final) return;
    onChange([...editable, { ...final, ...patch }]);
  }
  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= editable.length) return;
    const next = [...editable];
    [next[index], next[j]] = [next[j], next[index]];
    commit(next);
  }
  function remove(index: number) {
    commit(editable.filter((_, i) => i !== index));
  }
  function add(type: "narrative" | "name" | "motive") {
    commit([...editable, makeSlide(type)]);
  }

  return (
    <section className="glass rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">اسلایدهای سفرِ خوش‌آمدگویی</h2>
        <p className="text-xs text-fog mt-0.5 leading-relaxed">
          ترتیب، متن و اسلایدها را مدیریت کن. در متن‌ها <code className="text-ember">{"{name}"}</code> با نامِ کاربر جایگزین می‌شود.
        </p>
      </div>

      <div className="space-y-3">
        {editable.map((slide, i) => (
          <div key={slide.id} className="rounded-xl border border-black/8 bg-white/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-xs">
                <span className="text-fog">#{i + 1}</span>
                <span className="px-2 py-0.5 rounded-md bg-ink/5 text-stone font-medium">{TYPE_LABEL[slide.type]}</span>
              </span>
              <div className="flex items-center gap-1">
                <IconBtn label="بالا" disabled={disabled || i === 0} onClick={() => move(i, -1)}>↑</IconBtn>
                <IconBtn label="پایین" disabled={disabled || i === editable.length - 1} onClick={() => move(i, 1)}>↓</IconBtn>
                <IconBtn label="حذف" disabled={disabled} danger onClick={() => remove(i)}>✕</IconBtn>
              </div>
            </div>
            <SlideEditor slide={slide} disabled={disabled} onChange={(patch) => updateAt(i, patch)} />
          </div>
        ))}
      </div>

      {/* افزودنِ اسلاید */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-fog">افزودن:</span>
        <AddBtn disabled={disabled} onClick={() => add("narrative")}>+ روایی</AddBtn>
        {!hasName && <AddBtn disabled={disabled} onClick={() => add("name")}>+ نامِ کاربر</AddBtn>}
        {!hasMotive && <AddBtn disabled={disabled} onClick={() => add("motive")}>+ پرسشِ انگیزه</AddBtn>}
      </div>

      {/* اسلایدِ پایانی — همیشه آخر */}
      {final && (
        <div className="rounded-xl border border-sage/30 bg-sage/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-sage/20 text-sage-deep font-medium">اسلایدِ پایانی</span>
            <span className="text-fog">همیشه آخر · حذف‌ناپذیر</span>
          </div>
          <Field label="عنوان" value={final.title} disabled={disabled} onChange={(v) => updateFinal({ title: v })} />
          <FieldArea label="متن (می‌تواند {name} داشته باشد)" value={final.body} disabled={disabled} onChange={(v) => updateFinal({ body: v })} />
          <Field label="زیرنویس (اختیاری)" value={final.footnote} disabled={disabled} onChange={(v) => updateFinal({ footnote: v })} />
          <Field label="متنِ دکمه" value={final.buttonText} disabled={disabled} onChange={(v) => updateFinal({ buttonText: v })} />
        </div>
      )}
    </section>
  );
}

// ─── ویرایشگرِ اسلاید بر اساس نوع ─────────────────────────────────────────────
function SlideEditor({
  slide,
  disabled,
  onChange,
}: {
  slide: OnboardingSlide;
  disabled: boolean;
  onChange: (patch: Partial<OnboardingSlide>) => void;
}) {
  if (slide.type === "narrative") {
    const s = slide as NarrativeSlide;
    return (
      <div className="space-y-3">
        <Field label="عنوان" value={s.title} disabled={disabled} onChange={(v) => onChange({ title: v })} />
        <FieldArea label="متن (هر خط یک پاراگراف)" value={s.body} disabled={disabled} onChange={(v) => onChange({ body: v })} />
        <Field label="زیرنویس (اختیاری)" value={s.footnote} disabled={disabled} onChange={(v) => onChange({ footnote: v })} />
        <Field label="متنِ دکمه" value={s.buttonText} disabled={disabled} onChange={(v) => onChange({ buttonText: v })} />
      </div>
    );
  }
  if (slide.type === "name") {
    const s = slide as NameSlide;
    return (
      <div className="space-y-3">
        <Field label="عنوان" value={s.title} disabled={disabled} onChange={(v) => onChange({ title: v })} />
        <Field label="زیرنویس" value={s.subtitle} disabled={disabled} onChange={(v) => onChange({ subtitle: v })} />
        <Field label="متنِ راهنمای ورودی" value={s.placeholder} disabled={disabled} onChange={(v) => onChange({ placeholder: v })} />
        <Field label="متنِ دکمه" value={s.buttonText} disabled={disabled} onChange={(v) => onChange({ buttonText: v })} />
      </div>
    );
  }
  // motive
  const s = slide as MotiveSlide;
  return (
    <div className="space-y-3">
      <Field label="عنوان" value={s.title} disabled={disabled} onChange={(v) => onChange({ title: v })} />
      <Field label="زیرنویس" value={s.subtitle} disabled={disabled} onChange={(v) => onChange({ subtitle: v })} />
      <div className="space-y-2">
        <span className="text-[11px] text-fog">برچسبِ گزینه‌ها</span>
        {s.options.map((opt, oi) => (
          <input
            key={opt.slug}
            value={opt.label}
            disabled={disabled}
            onChange={(e) => {
              const options = s.options.map((o, k) => (k === oi ? { ...o, label: e.target.value.slice(0, 40) } : o));
              onChange({ options });
            }}
            dir="rtl"
            className="w-full rounded-lg px-3 py-2 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage disabled:opacity-60"
          />
        ))}
      </div>
      <Field label="متنِ دکمه" value={s.buttonText} disabled={disabled} onChange={(v) => onChange({ buttonText: v })} />
    </div>
  );
}

// ─── اجزای ورودیِ کوچک ────────────────────────────────────────────────────────
function Field({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-fog">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        dir="rtl"
        className="w-full rounded-lg px-3 py-2 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage disabled:opacity-60"
      />
    </label>
  );
}
function FieldArea({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-fog">{label}</span>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        dir="rtl"
        className="w-full rounded-lg px-3 py-2 text-sm bg-white/70 border border-bone text-ink leading-relaxed resize-none focus:outline-none focus:border-sage disabled:opacity-60"
      />
    </label>
  );
}
function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-colors disabled:opacity-30 ${
        danger
          ? "border-ember/30 text-ember hover:bg-ember/10"
          : "border-bone text-stone hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}
function AddBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 rounded-lg text-xs bg-white/60 border border-bone text-stone hover:text-ink hover:border-sage transition-colors disabled:opacity-40"
    >
      {children}
    </button>
  );
}
