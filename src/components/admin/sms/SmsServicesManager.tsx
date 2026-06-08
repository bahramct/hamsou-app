"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SmsServicesManager — مدیریت سرویس‌های پیامک (DECISION-061؛ آینهٔ AiServicesManager)
// فهرست تخت سرویس‌ها (بدون منطقه). هر سرویس: provider، قالب، پارامتر، آدرس، کلید، فعال، پیش‌فرض.
// کلید API: فقط Owner با نگه‌داشتن دکمه می‌بیند؛ سایر ادمین‌ها فقط وضعیت تنظیم‌شده/نشده.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export interface SmsServiceView {
  id: string;
  label: string;
  provider: string; // "smsir" | "mock"
  templateId: number | null;
  paramName: string | null;
  baseURL: string | null;
  isSandbox: boolean;
  isActive: boolean;
  isDefault: boolean;
  hasKey: boolean;
  note: string | null;
}

interface Props {
  services: SmsServiceView[];
  canManage: boolean;
  isOwner: boolean;
}

const PROVIDER_LABEL: Record<string, string> = {
  smsir: "sms.ir",
  mock: "آزمایشی (Mock)",
};

export function SmsServicesManager({ services, canManage, isOwner }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-ink">سرویس‌های پیامک</h2>
        {canManage && !adding && editingId === null && (
          <button
            onClick={() => setAdding(true)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-ink text-paper hover:bg-charcoal transition-colors"
          >
            + افزودن سرویس
          </button>
        )}
      </div>
      <p className="text-xs text-fog mb-3">
        هر سرویس = یک سرویس‌دهندهٔ پیامک با کلید و قالب خودش. یکی را <b>«پیش‌فرض»</b> کن — همان برای ارسال کدِ ورود استفاده می‌شود.
      </p>

      <div className="rounded-xl bg-mist/15 border border-mist/30 px-4 py-3 text-[12px] leading-relaxed text-charcoal mb-5">
        <div className="font-semibold text-ink mb-1">این بخش چطور کار می‌کند؟</div>
        <ul className="list-disc pr-4 space-y-1">
          <li>سرویس <b>sms.ir</b>: کلید وب‌سرویس + شناسهٔ قالبِ «کد تأیید» را وارد کن. sandbox و محیط واقعی یک endpoint دارند — فقط کلید فرق می‌کند.</li>
          <li>سرویس <b>آزمایشی (Mock)</b>: پیامکِ واقعی نمی‌فرستد؛ فقط در لاگ سرور ثبت می‌شود (برای توسعه).</li>
          <li><b>کلید API</b> فقط برای مالک قابل‌مشاهده است (با نگه‌داشتن دکمهٔ نمایش). برای تغییر، کلید جدید را وارد کن؛ خالی = بدون تغییر.</li>
          <li>برچسبِ <b>«سندباکس»</b> فقط نمایشی است تا بدانی کلیدِ آزمایشی است یا واقعی.</li>
        </ul>
      </div>

      {services.length === 0 && !adding && (
        <p className="text-[11px] text-fog bg-black/3 rounded-lg px-3 py-2">
          هنوز سرویسی ساخته نشده. یک سرویس بساز تا ارسال پیامک فعال شود.
        </p>
      )}

      <div className="space-y-2">
        {services.map((s) =>
          editingId === s.id ? (
            <SmsServiceForm
              key={s.id}
              mode="edit"
              service={s}
              isOwner={isOwner}
              onDone={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <SmsServiceRow
              key={s.id}
              service={s}
              canManage={canManage}
              disabled={adding || (editingId !== null && editingId !== s.id)}
              onEdit={() => setEditingId(s.id)}
            />
          )
        )}

        {adding && (
          <SmsServiceForm
            mode="create"
            isOwner={isOwner}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {!canManage && (
        <p className="text-xs text-fog mt-4">نقش تو فقط اجازهٔ مشاهده دارد (sms.read).</p>
      )}
    </section>
  );
}

// ─── ردیف نمایش یک سرویس ──────────────────────────────────────────────────────
function SmsServiceRow({
  service, canManage, disabled, onEdit,
}: {
  service: SmsServiceView; canManage: boolean; disabled: boolean; onEdit: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`سرویس «${service.label}» حذف شود؟`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sms/services/${service.id}`, { method: "DELETE" });
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
            <Badge tone="mist">{PROVIDER_LABEL[service.provider] ?? service.provider}</Badge>
            {service.isDefault && <Badge tone="sage">پیش‌فرض</Badge>}
            {service.isSandbox && <Badge tone="amber">سندباکس</Badge>}
            {!service.isActive && <Badge tone="ember">غیرفعال</Badge>}
          </div>
          <div className="text-[11px] text-fog mt-1 flex items-center gap-2 flex-wrap num-latin" dir="ltr">
            {service.provider === "smsir" && (
              <>
                <span>قالب: {service.templateId ?? "—"}</span>
                <span>·</span>
                <span>پارامتر: {service.paramName ?? "Code"}</span>
                <span>·</span>
                <span className={service.hasKey ? "text-sage-deep" : "text-ember"}>
                  {service.hasKey ? "کلید ✓" : "بدون کلید"}
                </span>
              </>
            )}
            {service.provider === "mock" && <span>بدون ارسال واقعی</span>}
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
function SmsServiceForm({
  mode, service, isOwner, onDone, onCancel,
}: {
  mode: "create" | "edit";
  service?: SmsServiceView;
  isOwner: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [label, setLabel] = useState(service?.label ?? "");
  const [provider, setProvider] = useState(service?.provider ?? "smsir");
  const [templateId, setTemplateId] = useState(service?.templateId != null ? String(service.templateId) : "");
  const [paramName, setParamName] = useState(service?.paramName ?? "Code");
  const [baseURL, setBaseURL] = useState(service?.baseURL ?? "");
  const [isSandbox, setIsSandbox] = useState(service?.isSandbox ?? true);
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [isDefault, setIsDefault] = useState(service?.isDefault ?? false);
  const [note, setNote] = useState(service?.note ?? "");
  const [newKey, setNewKey] = useState("");

  const [revealValue, setRevealValue] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSmsir = provider === "smsir";

  async function reveal() {
    setRevealing(true);
    if (revealValue === null && service) {
      try {
        const res = await fetch(`/api/admin/sms/services/${service.id}/key`, { method: "POST" });
        const d = await res.json();
        setRevealValue(d.ok ? (d.apiKey ?? "") : "");
      } catch { setRevealValue(""); }
    }
  }

  async function save() {
    setBusy(true);
    const payload: Record<string, unknown> = {
      label, provider, paramName, baseURL, isSandbox, isActive, isDefault, note,
    };
    if (isSmsir) payload.templateId = templateId;
    if (newKey.trim()) payload.apiKey = newKey.trim();

    try {
      const url = mode === "create" ? "/api/admin/sms/services" : `/api/admin/sms/services/${service!.id}`;
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
            placeholder="مثلاً: sms.ir (سندباکس)" className={inputCls} />
        </Field>
        <Field label="نوع سرویس‌دهنده">
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className={inputCls} dir="rtl">
            <option value="smsir">sms.ir (ارسال واقعی)</option>
            <option value="mock">آزمایشی (بدون ارسال)</option>
          </select>
        </Field>

        {isSmsir && (
          <>
            <Field label="شناسهٔ قالب (Template ID)">
              <input value={templateId} onChange={(e) => setTemplateId(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric" dir="ltr" placeholder="240766" className={`${inputCls} num-latin`} />
            </Field>
            <Field label="نام پارامتر قالب">
              <input value={paramName} onChange={(e) => setParamName(e.target.value)}
                dir="ltr" placeholder="Code" className={`${inputCls} num-latin`} />
            </Field>
            <Field label="آدرس سرویس (baseURL) — اختیاری" full>
              <input value={baseURL} onChange={(e) => setBaseURL(e.target.value)}
                dir="ltr" placeholder="https://api.sms.ir/v1" className={`${inputCls} num-latin`} />
            </Field>
          </>
        )}
      </div>

      {/* کلید API — فقط برای smsir */}
      {isSmsir && (
        <div className="rounded-lg border border-black/8 bg-black/3 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone">کلید وب‌سرویس</span>
            {mode === "edit" && service?.hasKey && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sage/15 text-sage-deep">تنظیم‌شده</span>
            )}
          </div>

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

          <input
            type="password"
            autoComplete="off"
            dir="ltr"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder={mode === "edit" && service?.hasKey ? "کلید جدید (خالی = بدون تغییر)" : "کلید وب‌سرویس را وارد کن"}
            className={`${inputCls} num-latin`}
          />
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          سرویس پیش‌فرض (برای ارسال کد ورود)
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          فعال
        </label>
        {isSmsir && (
          <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
            <input type="checkbox" checked={isSandbox} onChange={(e) => setIsSandbox(e.target.checked)} />
            کلید سندباکس (آزمایشی)
          </label>
        )}
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

function Badge({ children, tone }: { children: React.ReactNode; tone: "mist" | "sage" | "ember" | "amber" }) {
  const cls = {
    mist: "bg-mist/20 text-charcoal",
    sage: "bg-sage/15 text-sage-deep",
    ember: "bg-ember/10 text-ember",
    amber: "bg-amber-400/15 text-amber-700",
  }[tone];
  return <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>;
}
