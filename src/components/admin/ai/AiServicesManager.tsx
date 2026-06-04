"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AiServicesManager — مدیریت سرویس‌های AI (DECISION-039)
// گروه‌بندی بر اساس منطقه (ایران / غیرایران). هر سرویس: نوع، مدل، آدرس، کلید، فعال، پیش‌فرض.
// کلید API: فقط Owner با نگه‌داشتن دکمه می‌بیند؛ سایر ادمین‌ها فقط وضعیت تنظیم‌شده/نشده.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export interface ServiceView {
  id: string;
  label: string;
  region: string;
  kind: string;
  providerType: string;
  baseURL: string | null;
  model: string;
  isActive: boolean;
  isDefault: boolean;
  hasKey: boolean;
  note: string | null;
}

interface Props {
  services: ServiceView[];
  canManage: boolean;
  isOwner: boolean;
}

const REGIONS: { key: string; label: string; hint: string }[] = [
  { key: "IR", label: "سرویس‌دهنده برای کاربران ایران", hint: "کاربرانی که از داخل ایران (تشخیص IP) وارد می‌شوند به این سرویس‌ها می‌روند." },
  { key: "INTL", label: "سرویس‌دهنده برای کاربران غیر ایران", hint: "کاربران خارج از ایران و کشورِ ناشناس به این سرویس‌ها می‌روند." },
];

const KIND_LABEL: Record<string, string> = { text: "متنی", image: "تصویری" };
const PROVIDER_LABEL: Record<string, string> = {
  "openai-compatible": "سازگار با OpenAI",
};

export function AiServicesManager({ services, canManage, isOwner }: Props) {
  const [addingRegion, setAddingRegion] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <h2 className="text-sm font-semibold text-ink mb-1">سرویس‌دهنده‌های AI</h2>
      <p className="text-xs text-fog mb-3">
        هر سرویس = یک مدل از یک سرویس‌دهنده (با آدرس و کلید خودش). می‌توانی برای هر منطقه چند سرویس بسازی — مثلاً یک سرویس متنی برای چت و گزارش، و بعداً یک سرویس تصویری.
      </p>

      <div className="rounded-xl bg-mist/15 border border-mist/30 px-4 py-3 text-[12px] leading-relaxed text-charcoal mb-5">
        <div className="font-semibold text-ink mb-1">این بخش چطور کار می‌کند؟</div>
        <ul className="list-disc pr-4 space-y-1">
          <li>سرویس‌ها بر اساس <b>منطقهٔ کاربر</b> (ایران / غیرایران، از روی IP) جدا شده‌اند.</li>
          <li>برای هر منطقه و هر نوع (متنی/تصویری) یک سرویس را <b>«پیش‌فرض»</b> کن — اگر بخشی از سیستم به سرویس خاصی وصل نشده باشد، از همین پیش‌فرض استفاده می‌کند.</li>
          <li><b>کلید API</b> فقط برای مالک قابل‌مشاهده است (با نگه‌داشتن دکمهٔ نمایش). برای تغییر، کلید جدید را وارد کن؛ خالی بگذاری یعنی بدون تغییر.</li>
          <li>اگر منطقه‌ای سرویس مخصوص خودش نداشته باشد، از سرویس پیش‌فرضِ سراسری (تنها سرویس فعال) استفاده می‌شود.</li>
        </ul>
      </div>

      <div className="space-y-6">
        {REGIONS.map((region) => {
          const regionServices = services.filter((s) => s.region === region.key);
          return (
            <div key={region.key}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-ink">{region.label}</h3>
                  <p className="text-[11px] text-fog mt-0.5">{region.hint}</p>
                </div>
                {canManage && addingRegion !== region.key && editingId === null && (
                  <button
                    onClick={() => setAddingRegion(region.key)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-ink text-paper hover:bg-charcoal transition-colors"
                  >
                    + افزودن سرویس
                  </button>
                )}
              </div>

              {regionServices.length === 0 && addingRegion !== region.key && (
                <p className="text-[11px] text-fog bg-black/3 rounded-lg px-3 py-2">
                  هنوز سرویسی برای این منطقه ساخته نشده.
                </p>
              )}

              <div className="space-y-2">
                {regionServices.map((s) =>
                  editingId === s.id ? (
                    <ServiceForm
                      key={s.id}
                      mode="edit"
                      service={s}
                      isOwner={isOwner}
                      onDone={() => setEditingId(null)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <ServiceRow
                      key={s.id}
                      service={s}
                      canManage={canManage}
                      disabled={addingRegion !== null || (editingId !== null && editingId !== s.id)}
                      onEdit={() => setEditingId(s.id)}
                    />
                  )
                )}

                {addingRegion === region.key && (
                  <ServiceForm
                    mode="create"
                    region={region.key}
                    isOwner={isOwner}
                    onDone={() => setAddingRegion(null)}
                    onCancel={() => setAddingRegion(null)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!canManage && (
        <p className="text-xs text-fog mt-4">نقش تو فقط اجازهٔ مشاهده دارد (ai.read).</p>
      )}
    </section>
  );
}

// ─── ردیف نمایش یک سرویس ──────────────────────────────────────────────────────
function ServiceRow({
  service, canManage, disabled, onEdit,
}: {
  service: ServiceView; canManage: boolean; disabled: boolean; onEdit: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`سرویس «${service.label}» حذف شود؟`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ai/services/${service.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("سرویس حذف شد"); router.refresh(); }
      else toast.error("حذف ناموفق بود");
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className={`rounded-xl border border-black/8 bg-white/50 px-4 py-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-ink">{service.label}</span>
            <Badge tone="mist">{KIND_LABEL[service.kind] ?? service.kind}</Badge>
            {service.isDefault && <Badge tone="sage">پیش‌فرض</Badge>}
            {!service.isActive && <Badge tone="ember">غیرفعال</Badge>}
          </div>
          <div className="text-[11px] text-fog mt-1 flex items-center gap-2 flex-wrap num-latin" dir="ltr">
            <span className="text-stone">{PROVIDER_LABEL[service.providerType] ?? service.providerType}</span>
            <span>·</span>
            <span>{service.model}</span>
            <span>·</span>
            <span className={service.hasKey ? "text-sage-deep" : "text-ember"}>
              {service.hasKey ? "کلید ✓" : "بدون کلید"}
            </span>
          </div>
        </div>
        {canManage && !disabled && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onEdit} className="text-xs text-stone hover:text-ink">ویرایش</button>
            <button onClick={remove} disabled={busy} className="text-xs text-ember hover:underline disabled:opacity-40">حذف</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── فرم ساخت/ویرایش سرویس ────────────────────────────────────────────────────
function ServiceForm({
  mode, service, region, isOwner, onDone, onCancel,
}: {
  mode: "create" | "edit";
  service?: ServiceView;
  region?: string;
  isOwner: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [label, setLabel] = useState(service?.label ?? "");
  const [kind, setKind] = useState(service?.kind ?? "text");
  const [providerType, setProviderType] = useState(service?.providerType ?? "openai-compatible");
  const [model, setModel] = useState(service?.model ?? "");
  const [baseURL, setBaseURL] = useState(service?.baseURL ?? "");
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [isDefault, setIsDefault] = useState(service?.isDefault ?? false);
  const [note, setNote] = useState(service?.note ?? "");
  const [newKey, setNewKey] = useState("");

  // نمایش کلید فعلی (فقط Owner، با نگه‌داشتن)
  const [revealValue, setRevealValue] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const [busy, setBusy] = useState(false);

  async function reveal() {
    setRevealing(true);
    if (revealValue === null && service) {
      try {
        const res = await fetch(`/api/admin/ai/services/${service.id}/key`, { method: "POST" });
        const d = await res.json();
        if (d.ok) setRevealValue(d.apiKey ?? "");
        else setRevealValue("");
      } catch { setRevealValue(""); }
    }
  }

  async function save() {
    setBusy(true);
    const payload: Record<string, unknown> = {
      label, kind, providerType, model,
      baseURL,
      isActive, isDefault, note,
    };
    if (newKey.trim()) payload.apiKey = newKey.trim();
    if (mode === "create") payload.region = region;

    try {
      const url = mode === "create"
        ? "/api/admin/ai/services"
        : `/api/admin/ai/services/${service!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "خطا در ذخیره."); return; }
      toast.success(mode === "create" ? "سرویس ساخته شد" : "تغییرات سرویس ذخیره شد");
      router.refresh();
      onDone();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className="rounded-xl border border-sage/40 bg-white/70 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="برچسب سرویس">
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="مثلاً: سرویس متنی ایران (GapGPT)"
            className={inputCls} />
        </Field>
        <Field label="نوع">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls} dir="rtl">
            <option value="text">متنی (چت، گزارش، تأمل)</option>
            <option value="image">تصویری (اینفوگرافیک — به‌زودی)</option>
          </select>
        </Field>
        <Field label="نوع سرویس‌دهنده">
          <select value={providerType} onChange={(e) => setProviderType(e.target.value)} className={inputCls} dir="rtl">
            <option value="openai-compatible">سازگار با OpenAI (متن)</option>
          </select>
        </Field>
        <Field label="نام مدل">
          <input value={model} onChange={(e) => setModel(e.target.value)} dir="ltr"
            placeholder="gpt-4o-mini" className={`${inputCls} num-latin`} />
        </Field>
        <Field label="آدرس سرویس (baseURL)" full>
          <input value={baseURL} onChange={(e) => setBaseURL(e.target.value)} dir="ltr"
            placeholder="https://api.gapgpt.app/v1" className={`${inputCls} num-latin`} />
        </Field>
      </div>

      {/* کلید API */}
      <div className="rounded-lg border border-black/8 bg-black/3 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone">کلید API</span>
            {mode === "edit" && service?.hasKey && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sage/15 text-sage-deep">تنظیم‌شده</span>
            )}
          </div>

          {/* نمایش کلید فعلی — فقط Owner، با نگه‌داشتن دکمه */}
          {mode === "edit" && isOwner && service?.hasKey && (
            <div className="flex items-center gap-2">
              <code dir="ltr" className="flex-1 text-[11px] text-ink bg-white/70 border border-bone rounded px-2 py-1.5 truncate num-latin">
                {revealing ? (revealValue ?? "در حال خواندن…") : "••••••••••••••••"}
              </code>
              <button
                type="button"
                onMouseDown={reveal}
                onMouseUp={() => setRevealing(false)}
                onMouseLeave={() => setRevealing(false)}
                onTouchStart={(e) => { e.preventDefault(); reveal(); }}
                onTouchEnd={() => setRevealing(false)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-black/6 text-stone hover:bg-black/10 select-none"
              >
                نمایش (نگه‌دار)
              </button>
            </div>
          )}
          {mode === "edit" && !isOwner && (
            <p className="text-[10px] text-fog">مشاهدهٔ کلید فقط برای مالک ممکن است. می‌توانی کلید جدید وارد کنی.</p>
          )}

          {/* ورود کلید جدید */}
          <input
            type="password"
            autoComplete="off"
            dir="ltr"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder={mode === "edit" && service?.hasKey ? "کلید جدید (خالی = بدون تغییر)" : "کلید API را وارد کن"}
            className={`${inputCls} num-latin`}
          />
        </div>

      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          پیش‌فرضِ این منطقه/نوع
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          فعال
        </label>
      </div>

      <Field label="یادداشت (اختیاری)">
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </Field>

      <div className="flex items-center gap-2">
        <button onClick={save} disabled={busy}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-ink text-paper text-sm hover:bg-charcoal transition-colors disabled:opacity-40">
          {busy && <Spinner />}
          {mode === "create" ? "ساخت سرویس" : "ذخیره تغییرات"}
        </button>
        <button onClick={onCancel} disabled={busy} className="px-3 py-2 rounded-lg text-sm text-stone hover:bg-black/4">
          انصراف
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <label className="text-[11px] font-medium text-stone">{label}</label>
      {children}
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "mist" | "sage" | "ember" }) {
  const cls = {
    mist: "bg-mist/20 text-charcoal",
    sage: "bg-sage/15 text-sage-deep",
    ember: "bg-ember/10 text-ember",
  }[tone];
  return <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>;
}
