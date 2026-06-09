"use client";

// ─────────────────────────────────────────────────────────────────────────────
// EmailServicesManager — مدیریت سرویس‌های ایمیل (DECISION-064؛ آینهٔ SmsServicesManager)
// فهرست سرویس‌ها (Resend / Mock). هر سرویس: provider، fromAddress، fromName، کلید، فعال، پیش‌فرض.
// کلید API: فقط Owner با نگه‌داشتن دکمه می‌بیند.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export interface EmailServiceView {
  id: string;
  label: string;
  provider: string; // "resend" | "mock"
  fromAddress: string;
  fromName: string;
  isActive: boolean;
  isDefault: boolean;
  hasKey: boolean;
  note: string | null;
}

interface Props {
  services: EmailServiceView[];
  canManage: boolean;
  isOwner: boolean;
}

const PROVIDER_LABEL: Record<string, string> = {
  resend: "Resend",
  mock: "آزمایشی (Mock)",
};

export function EmailServicesManager({ services, canManage, isOwner }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-ink">سرویس‌های ایمیل</h2>
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
        هر سرویس = یک سرویس‌دهندهٔ ایمیل با کلید و آدرسِ فرستنده. یکی را <b>«پیش‌فرض»</b> کن — همان برای ارسال همهٔ ایمیل‌های سیستمی استفاده می‌شود.
      </p>

      <div className="rounded-xl bg-mist/15 border border-mist/30 px-4 py-3 text-[12px] leading-relaxed text-charcoal mb-5">
        <div className="font-semibold text-ink mb-1">این بخش چطور کار می‌کند؟</div>
        <ul className="list-disc pr-4 space-y-1">
          <li>سرویس <b>Resend</b>: کلید API از resend.com را وارد کن. ایمیل از آدرس <b>fromAddress</b> ارسال می‌شود — DNS آن دامنه باید در Resend تأیید شده باشد.</li>
          <li>سرویس <b>آزمایشی (Mock)</b>: ایمیل واقعی نمی‌فرستد؛ فقط در لاگ سرور ثبت می‌شود.</li>
          <li><b>کلید API</b> فقط برای مالک قابل‌مشاهده است. برای تغییر، کلید جدید را وارد کن.</li>
        </ul>
      </div>

      {services.length === 0 && !adding && (
        <p className="text-[11px] text-fog bg-black/3 rounded-lg px-3 py-2">
          هنوز سرویسی ساخته نشده. یک سرویس بساز تا ارسال ایمیل فعال شود.
        </p>
      )}

      <div className="space-y-2">
        {services.map((s) =>
          editingId === s.id ? (
            <EmailServiceForm
              key={s.id}
              initial={s}
              isOwner={isOwner}
              onCancel={() => setEditingId(null)}
              onSaved={() => { setEditingId(null); }}
            />
          ) : (
            <EmailServiceCard
              key={s.id}
              service={s}
              canManage={canManage}
              isOwner={isOwner}
              onEdit={() => setEditingId(s.id)}
            />
          )
        )}
        {adding && (
          <EmailServiceForm
            isOwner={isOwner}
            onCancel={() => setAdding(false)}
            onSaved={() => { setAdding(false); }}
          />
        )}
      </div>
    </section>
  );
}

// ─── کارت سرویس ──────────────────────────────────────────────────────────────

function EmailServiceCard({
  service: s,
  canManage,
  isOwner,
  onEdit,
}: {
  service: EmailServiceView;
  canManage: boolean;
  isOwner: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);
  const [keyValue, setKeyValue] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);
  const [togglingDefault, setTogglingDefault] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchKey() {
    if (!isOwner) return;
    setLoadingKey(true);
    const res = await fetch(`/api/admin/email/services/${s.id}/key`);
    const data = await res.json();
    if (res.ok) setKeyValue(data.apiKey || "(بدون کلید)");
    else toast.error(data.error ?? "خطا در دریافت کلید");
    setLoadingKey(false);
    setShowKey(true);
  }

  async function toggleDefault() {
    if (s.isDefault) return;
    setTogglingDefault(true);
    const res = await fetch(`/api/admin/email/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) { toast.success("سرویس پیش‌فرض شد."); router.refresh(); }
    else { const d = await res.json(); toast.error(d.error ?? "خطا"); }
    setTogglingDefault(false);
  }

  async function toggleActive() {
    setTogglingActive(true);
    const res = await fetch(`/api/admin/email/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    if (res.ok) { router.refresh(); }
    else { const d = await res.json(); toast.error(d.error ?? "خطا"); }
    setTogglingActive(false);
  }

  async function deleteService() {
    if (!confirm(`سرویس «${s.label}» حذف شود؟`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/email/services/${s.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("سرویس حذف شد."); router.refresh(); }
    else { const d = await res.json(); toast.error(d.error ?? "خطا"); }
    setDeleting(false);
  }

  const isReal = s.provider === "resend";

  return (
    <div className={`rounded-xl border px-4 py-3 ${s.isActive ? "bg-white/60 border-black/8" : "bg-black/3 border-black/5 opacity-60"}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-ink">{s.label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 text-fog num-latin">{PROVIDER_LABEL[s.provider] ?? s.provider}</span>
            {s.isDefault && <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage/20 text-sage-deep">پیش‌فرض</span>}
            {!s.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-ember/10 text-ember">غیرفعال</span>}
          </div>
          <div className="text-[11px] text-fog num-latin" dir="ltr">{s.fromName} &lt;{s.fromAddress}&gt;</div>
          {isReal && (
            <div className="text-[11px] text-fog">
              کلید API: {s.hasKey ? (
                isOwner ? (
                  showKey ? (
                    <span className="font-mono text-stone break-all" dir="ltr">{loadingKey ? "..." : keyValue}</span>
                  ) : (
                    <button
                      onMouseDown={fetchKey}
                      onMouseUp={() => setShowKey(false)}
                      onMouseLeave={() => setShowKey(false)}
                      className="text-sage-deep hover:underline"
                    >
                      {loadingKey ? <Spinner size={10} /> : "نگه بدار تا ببینی"}
                    </button>
                  )
                ) : (
                  <span className="text-sage-deep">تنظیم‌شده ✓</span>
                )
              ) : (
                <span className="text-ember">تنظیم نشده</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {canManage && !s.isDefault && (
            <button
              onClick={toggleDefault}
              disabled={togglingDefault}
              className="text-[11px] px-2 py-1 rounded-lg border border-black/10 hover:bg-black/5 transition-colors text-stone disabled:opacity-40"
            >
              {togglingDefault ? <Spinner size={10} /> : "پیش‌فرض"}
            </button>
          )}
          {canManage && (
            <button
              onClick={toggleActive}
              disabled={togglingActive}
              className="text-[11px] px-2 py-1 rounded-lg border border-black/10 hover:bg-black/5 transition-colors text-stone disabled:opacity-40"
            >
              {togglingActive ? <Spinner size={10} /> : s.isActive ? "غیرفعال" : "فعال"}
            </button>
          )}
          {canManage && (
            <button
              onClick={onEdit}
              className="text-[11px] px-2 py-1 rounded-lg border border-black/10 hover:bg-black/5 transition-colors text-stone"
            >
              ویرایش
            </button>
          )}
          {canManage && !s.isDefault && (
            <button
              onClick={deleteService}
              disabled={deleting}
              className="text-[11px] px-2 py-1 rounded-lg border border-ember/30 hover:bg-ember/5 transition-colors text-ember disabled:opacity-40"
            >
              {deleting ? <Spinner size={10} /> : "حذف"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── فرم افزودن/ویرایش ────────────────────────────────────────────────────────

function EmailServiceForm({
  initial,
  isOwner,
  onCancel,
  onSaved,
}: {
  initial?: EmailServiceView;
  isOwner: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [label, setLabel] = useState(initial?.label ?? "");
  const [provider, setProvider] = useState(initial?.provider ?? "resend");
  const [fromAddress, setFromAddress] = useState(initial?.fromAddress ?? "noreply@hamsoo.app");
  const [fromName, setFromName] = useState(initial?.fromName ?? "همسو");
  const [apiKey, setApiKey] = useState("");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [note, setNote] = useState(initial?.note ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = initial ? `/api/admin/email/services/${initial.id}` : "/api/admin/email/services";
      const method = initial ? "PATCH" : "POST";
      const body: Record<string, unknown> = { label, provider, fromAddress, fromName, isDefault, note };
      if (apiKey.trim()) body.apiKey = apiKey.trim();

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطا در ذخیره."); return; }
      toast.success(initial ? "سرویس بروزرسانی شد." : "سرویس ساخته شد.");
      router.refresh();
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-sage/30 bg-sage/5 px-4 py-4 space-y-3">
      <div className="text-xs font-semibold text-ink mb-1">{initial ? "ویرایش سرویس" : "سرویس جدید"}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-stone block mb-1">برچسب سرویس</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="مثلاً: Resend (production)"
            className="w-full text-xs rounded-lg px-3 py-2 border border-black/10 bg-white/70 focus:outline-none focus:border-sage"
          />
        </div>

        <div>
          <label className="text-[11px] text-stone block mb-1">سرویس‌دهنده</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full text-xs rounded-lg px-3 py-2 border border-black/10 bg-white/70 focus:outline-none focus:border-sage"
          >
            <option value="resend">Resend</option>
            <option value="mock">آزمایشی (Mock)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] text-stone block mb-1">آدرس فرستنده</label>
          <input
            dir="ltr"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="noreply@hamsoo.app"
            className="w-full text-xs rounded-lg px-3 py-2 border border-black/10 bg-white/70 focus:outline-none focus:border-sage font-mono"
          />
        </div>

        <div>
          <label className="text-[11px] text-stone block mb-1">نام فرستنده</label>
          <input
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="همسو"
            className="w-full text-xs rounded-lg px-3 py-2 border border-black/10 bg-white/70 focus:outline-none focus:border-sage"
          />
        </div>

        {(provider === "resend" && isOwner) && (
          <div className="sm:col-span-2">
            <label className="text-[11px] text-stone block mb-1">
              کلید API Resend {initial?.hasKey ? "(خالی = بدون تغییر)" : ""}
            </label>
            <input
              dir="ltr"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={initial?.hasKey ? "برای تغییر وارد کن" : "re_..."}
              className="w-full text-xs rounded-lg px-3 py-2 border border-black/10 bg-white/70 focus:outline-none focus:border-sage font-mono"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="text-[11px] text-stone block mb-1">یادداشت (اختیاری)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثلاً: دامنهٔ hamsoo.app در Resend تأیید شده"
            className="w-full text-xs rounded-lg px-3 py-2 border border-black/10 bg-white/70 focus:outline-none focus:border-sage"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="rounded"
        />
        <span className="text-xs text-stone">این سرویس را پیش‌فرض کن</span>
      </label>

      {error && <p className="text-xs text-ember">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !label.trim()}
          className="text-xs px-4 py-2 rounded-lg bg-ink text-paper hover:bg-charcoal transition-colors disabled:opacity-40 flex items-center gap-1.5"
        >
          {loading && <Spinner size={12} className="text-paper" />}
          ذخیره
        </button>
        <button type="button" onClick={onCancel} className="text-xs px-3 py-2 rounded-lg border border-black/10 hover:bg-black/5 transition-colors text-stone">
          انصراف
        </button>
      </div>
    </form>
  );
}
