"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ContentEditor — ویرایشگرِ سکشن‌های یک صفحه (DECISION-066)
// ترتیب (بالا/پایین) · نمایش/مخفی · ویرایشِ فیلد · اندازهٔ فونت · افزودن/حذف ·
// ذخیرهٔ پیش‌نویس · پیش‌نمایش · انتشار · بازگردانی به پیش‌فرض.
// متنِ دکمه‌ها ثابت (DECISION-053): فقط Spinner + toast؛ toggleها بازتابِ حالت‌اند.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import type { FieldDef, SectionContent, SectionInstance } from "@/lib/cms/types";
import type { SectionSchema } from "@/lib/cms/admin";

interface WorkingSection {
  uid: string;
  type: string;
  isVisible: boolean;
  content: SectionContent;
}

let UID = 0;
const newUid = () => `s${Date.now()}_${UID++}`;

function toWorking(s: SectionInstance): WorkingSection {
  return {
    uid: newUid(),
    type: s.type,
    isVisible: s.isVisible,
    content: { fields: { ...(s.content?.fields ?? {}) }, styles: { ...(s.content?.styles ?? {}) } },
  };
}

interface Props {
  pageKey: string;
  pageLabel: string;
  pagePath: string;
  initialSections: SectionInstance[];
  schemas: SectionSchema[];
  canWrite: boolean;
  hasPublished: boolean;
}

export function ContentEditor({
  pageKey,
  pageLabel,
  pagePath,
  initialSections,
  schemas,
  canWrite,
}: Props) {
  const router = useRouter();
  const [sections, setSections] = useState<WorkingSection[]>(initialSections.map(toWorking));
  const [expanded, setExpanded] = useState<string | null>(sections[0]?.uid ?? null);
  const [busy, setBusy] = useState<null | "save" | "publish" | "reset" | "preview">(null);
  const [dirty, setDirty] = useState(false);
  const [adding, setAdding] = useState(false);

  const schemaByType = new Map(schemas.map((s) => [s.type, s]));

  function mutate(fn: (draft: WorkingSection[]) => WorkingSection[]) {
    setSections((prev) => fn(prev));
    setDirty(true);
  }

  function setField(uid: string, key: string, value: unknown) {
    mutate((prev) => prev.map((s) => (s.uid === uid ? { ...s, content: { ...s.content, fields: { ...s.content.fields, [key]: value } } } : s)));
  }
  function setFontSize(uid: string, key: string, fontSize: string) {
    mutate((prev) =>
      prev.map((s) => {
        if (s.uid !== uid) return s;
        const styles = { ...(s.content.styles ?? {}) };
        if (fontSize.trim()) styles[key] = { fontSize: fontSize.trim() };
        else delete styles[key];
        return { ...s, content: { ...s.content, styles } };
      })
    );
  }
  function toggleVisible(uid: string) {
    mutate((prev) => prev.map((s) => (s.uid === uid ? { ...s, isVisible: !s.isVisible } : s)));
  }
  function move(uid: string, dir: -1 | 1) {
    mutate((prev) => {
      const i = prev.findIndex((s) => s.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function remove(uid: string) {
    if (!confirm("این سکشن از این صفحه حذف شود؟ (تا انتشار، روی سایتِ زنده اثری ندارد)")) return;
    mutate((prev) => prev.filter((s) => s.uid !== uid));
  }
  function addSection(type: string) {
    setAdding(false);
    const s: WorkingSection = { uid: newUid(), type, isVisible: true, content: { fields: {}, styles: {} } };
    mutate((prev) => [...prev, s]);
    setExpanded(s.uid);
  }

  function payload() {
    return sections.map((s) => ({ type: s.type, isVisible: s.isVisible, content: s.content }));
  }

  async function save(): Promise<boolean> {
    const res = await fetch(`/api/admin/content/${pageKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: payload() }),
    });
    const d = await res.json();
    return res.ok && d?.ok;
  }

  async function onSave() {
    if (busy) return;
    setBusy("save");
    try {
      if (await save()) { toast.success("پیش‌نویس ذخیره شد."); setDirty(false); }
      else toast.error("ذخیره نشد.");
    } catch { toast.error("ارتباط برقرار نشد."); }
    finally { setBusy(null); }
  }

  async function onPublish() {
    if (busy) return;
    setBusy("publish");
    try {
      if (!(await save())) { toast.error("ذخیره پیش از انتشار ناموفق بود."); return; }
      const res = await fetch(`/api/admin/content/${pageKey}/publish`, { method: "POST" });
      const d = await res.json();
      if (res.ok && d?.ok) { toast.success("روی سایتِ زنده منتشر شد."); setDirty(false); router.refresh(); }
      else toast.error(d?.error ?? "انتشار نشد.");
    } catch { toast.error("ارتباط برقرار نشد."); }
    finally { setBusy(null); }
  }

  async function onPreview() {
    if (busy) return;
    setBusy("preview");
    try {
      if (!(await save())) { toast.error("ذخیره برای پیش‌نمایش ناموفق بود."); return; }
      setDirty(false);
      window.open(`/admin/content-preview/${pageKey}`, "_blank");
    } catch { toast.error("ارتباط برقرار نشد."); }
    finally { setBusy(null); }
  }

  async function onReset() {
    if (busy) return;
    if (!confirm("پیش‌نویس به طراحیِ پیش‌فرضِ اصلی بازگردانده شود؟ تغییراتِ ذخیره‌نشده از بین می‌رود.")) return;
    setBusy("reset");
    try {
      const res = await fetch(`/api/admin/content/${pageKey}/reset`, { method: "POST" });
      if (!res.ok) { toast.error("بازگردانی نشد."); return; }
      const g = await fetch(`/api/admin/content/${pageKey}`, { cache: "no-store" });
      const d = await g.json();
      if (d?.ok) {
        setSections((d.sections as SectionInstance[]).map(toWorking));
        setDirty(false);
        toast.success("به طراحیِ پیش‌فرض بازگشت.");
      }
    } catch { toast.error("ارتباط برقرار نشد."); }
    finally { setBusy(null); }
  }

  return (
    <div>
      {/* نوارِ اکشن */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink">{pageLabel}</h1>
          <p className="text-xs text-fog mt-0.5">
            <span dir="ltr">{pagePath}</span>
            {dirty && <span className="text-gold"> · تغییرِ ذخیره‌نشده</span>}
          </p>
        </div>
        {canWrite && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={onReset} disabled={!!busy} className="text-xs px-3 py-2 rounded-xl text-stone hover:bg-black/5 transition-colors inline-flex items-center gap-1.5">
              {busy === "reset" && <Spinner size={13} />}
              بازگردانی به پیش‌فرض
            </button>
            <button onClick={onPreview} disabled={!!busy} className="text-xs px-3 py-2 rounded-xl bg-black/5 text-stone hover:bg-black/10 transition-colors inline-flex items-center gap-1.5">
              {busy === "preview" && <Spinner size={13} />}
              پیش‌نمایش
            </button>
            <button onClick={onSave} disabled={!!busy} className="text-xs px-4 py-2 rounded-xl bg-black/8 text-ink hover:bg-black/12 transition-colors inline-flex items-center gap-1.5">
              {busy === "save" && <Spinner size={13} />}
              ذخیرهٔ پیش‌نویس
            </button>
            <button onClick={onPublish} disabled={!!busy} className="text-xs px-4 py-2 rounded-xl bg-ink text-paper hover:bg-charcoal transition-colors inline-flex items-center gap-1.5">
              {busy === "publish" && <Spinner size={13} />}
              انتشار روی سایت
            </button>
          </div>
        )}
      </div>

      {/* فهرستِ سکشن‌ها */}
      <div className="space-y-2.5">
        {sections.map((s, i) => {
          const schema = schemaByType.get(s.type);
          const isOpen = expanded === s.uid;
          return (
            <div key={s.uid} className="rounded-2xl border border-black/8 bg-white/40 overflow-hidden" style={{ opacity: s.isVisible ? 1 : 0.55 }}>
              {/* سرِ سکشن */}
              <div className="flex items-center gap-2 p-3">
                <div className="flex flex-col">
                  <button onClick={() => move(s.uid, -1)} disabled={i === 0 || !canWrite} className="text-fog hover:text-ink disabled:opacity-30 leading-none" title="بالا">▴</button>
                  <button onClick={() => move(s.uid, 1)} disabled={i === sections.length - 1 || !canWrite} className="text-fog hover:text-ink disabled:opacity-30 leading-none" title="پایین">▾</button>
                </div>
                <button onClick={() => setExpanded(isOpen ? null : s.uid)} className="flex-1 text-right">
                  <span className="text-sm font-medium text-ink">{schema?.label ?? s.type}</span>
                  {!s.isVisible && <span className="text-[10px] text-fog mr-2">(مخفی)</span>}
                </button>
                {canWrite && (
                  <>
                    <button onClick={() => toggleVisible(s.uid)} className="text-xs px-2 py-1 rounded-lg text-stone hover:bg-black/5" title={s.isVisible ? "مخفی کن" : "نمایش بده"}>
                      {s.isVisible ? "نمایش" : "مخفی"}
                    </button>
                    <button onClick={() => remove(s.uid)} className="text-xs px-2 py-1 rounded-lg text-ember hover:bg-ember/8" title="حذف">حذف</button>
                  </>
                )}
                <button onClick={() => setExpanded(isOpen ? null : s.uid)} className="text-fog hover:text-ink px-1" title="ویرایش">
                  {isOpen ? "▾" : "‹"}
                </button>
              </div>

              {/* فیلدها */}
              {isOpen && schema && (
                <div className="border-t border-black/6 p-4 space-y-4 bg-black/2">
                  {schema.fields.map((f) => (
                    <FieldEditor
                      key={f.key}
                      field={f}
                      value={s.content.fields[f.key]}
                      defaultValue={schema.defaults[f.key]}
                      fontSize={s.content.styles?.[f.key]?.fontSize ?? ""}
                      defaultFontSize={schema.defaultStyles[f.key]?.fontSize ?? f.defaultFontSize ?? ""}
                      disabled={!canWrite}
                      onChange={(v) => setField(s.uid, f.key, v)}
                      onFontSize={(v) => setFontSize(s.uid, f.key, v)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* افزودنِ سکشن */}
      {canWrite && (
        <div className="mt-3 relative">
          <button onClick={() => setAdding((v) => !v)} className="text-sm px-4 py-2.5 rounded-xl border border-dashed border-black/15 text-stone hover:bg-black/4 transition-colors w-full">
            + افزودنِ سکشن
          </button>
          {adding && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-black/10 bg-white shadow-lg overflow-hidden">
              {schemas.map((sc) => (
                <button key={sc.type} onClick={() => addSection(sc.type)} className="block w-full text-right px-4 py-2.5 text-sm text-stone hover:bg-black/4 transition-colors border-b border-black/4 last:border-0">
                  {sc.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ویرایشگرِ یک فیلد ──────────────────────────────────────────────────────
function FieldEditor({
  field,
  value,
  defaultValue,
  fontSize,
  defaultFontSize,
  disabled,
  onChange,
  onFontSize,
}: {
  field: FieldDef;
  value: unknown;
  defaultValue: unknown;
  fontSize: string;
  defaultFontSize: string;
  disabled: boolean;
  onChange: (v: unknown) => void;
  onFontSize: (v: string) => void;
}) {
  const inp = "w-full bg-white/70 border border-black/10 rounded-lg px-3 py-2 text-sm text-ink outline-none disabled:opacity-60";
  const cur = value ?? defaultValue;
  const sizable = field.type === "text" || field.type === "textarea";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-stone">{field.label}</label>
        {sizable && (
          <input
            value={fontSize}
            onChange={(e) => onFontSize(e.target.value)}
            placeholder={`فونت: ${defaultFontSize || "پیش‌فرض"}`}
            disabled={disabled}
            dir="ltr"
            className="w-40 bg-white/60 border border-black/10 rounded-md px-2 py-1 text-[11px] text-stone outline-none disabled:opacity-60"
            title="اندازهٔ فونت — خالی = پیش‌فرض"
          />
        )}
      </div>

      {field.type === "text" && (
        <input value={(cur as string) ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={inp} />
      )}

      {field.type === "textarea" && (
        <textarea value={(cur as string) ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} rows={3} className={`${inp} resize-y`} style={{ lineHeight: 1.8 }} />
      )}

      {field.type === "list" && (
        <ListEditor items={Array.isArray(cur) ? (cur as string[]) : []} disabled={disabled} onChange={onChange} itemLabel={field.itemLabel} />
      )}

      {field.type === "cta" && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={((cur as { label?: string })?.label) ?? ""}
            onChange={(e) => onChange({ ...(cur as object), label: e.target.value })}
            placeholder="متنِ دکمه" disabled={disabled} className={inp}
          />
          <input
            value={((cur as { href?: string })?.href) ?? ""}
            onChange={(e) => onChange({ ...(cur as object), href: e.target.value })}
            placeholder="لینک" dir="ltr" disabled={disabled} className={inp}
          />
        </div>
      )}

      {field.type === "image" && (
        <ImageField value={(cur as string) ?? ""} disabled={disabled} onChange={onChange} />
      )}

      {field.hint && <p className="text-[10px] text-fog mt-1">{field.hint}</p>}
    </div>
  );
}

function ListEditor({ items, disabled, onChange, itemLabel }: { items: string[]; disabled: boolean; onChange: (v: string[]) => void; itemLabel?: string }) {
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            value={it}
            onChange={(e) => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
            disabled={disabled}
            className="flex-1 bg-white/70 border border-black/10 rounded-lg px-3 py-2 text-sm text-ink outline-none disabled:opacity-60"
          />
          {!disabled && (
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-fog hover:text-ember px-1.5" title="حذف">✕</button>
          )}
        </div>
      ))}
      {!disabled && (
        <button onClick={() => onChange([...items, ""])} className="text-xs text-sage-deep hover:underline">+ افزودنِ {itemLabel ?? "مورد"}</button>
      )}
    </div>
  );
}

function ImageField({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await compressImage(file, 1600, 0.82);
      onChange(url);
    } catch { toast.error("پردازشِ تصویر نشد."); }
    finally { if (fileRef.current) fileRef.current.value = ""; }
  }
  return (
    <div>
      {value ? (
        <div className="relative rounded-lg overflow-hidden inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-32 rounded-lg" />
          {!disabled && <button onClick={() => onChange("")} className="absolute top-1 left-1 w-6 h-6 rounded-full bg-ink/70 text-paper text-xs">✕</button>}
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={disabled} className="text-xs px-3 py-2 rounded-lg border border-dashed border-black/15 text-stone hover:bg-black/4">انتخابِ تصویر</button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
    </div>
  );
}

function compressImage(file: File, maxW: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const cx = canvas.getContext("2d");
        if (!cx) return reject(new Error("no-ctx"));
        cx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
