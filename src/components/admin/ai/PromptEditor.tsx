"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PromptEditor — ویرایش system/user یک نقش با نسخه‌سازی، اعتبارسنجی، بازگشت (DECISION-037)
// محافظ: placeholderهای ناشناخته قبل از ذخیره هشدار می‌دهند (مطابق runtime).
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export interface PromptVersion {
  version: number;
  isActive: boolean;
  note: string | null;
  dateLabel: string;
  systemTemplate: string;
  userTemplate: string;
}

interface Props {
  roleKey: string;
  roleLabel: string;
  locale: string;
  variables: { name: string; desc: string }[];
  fileDefault: { systemTemplate: string; userTemplate: string };
  versions: PromptVersion[];
  activeVersion: number | null;
  canManage: boolean;
}

function extractPlaceholders(t: string): string[] {
  const re = /\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) out.add(m[1]);
  return [...out];
}

export function PromptEditor({
  roleKey, locale, variables, fileDefault, versions, activeVersion, canManage,
}: Props) {
  const router = useRouter();

  // محتوای اولیه = نسخهٔ فعال یا پیش‌فرض فایل
  const initialActive = versions.find((v) => v.version === activeVersion);
  const [system, setSystem] = useState(initialActive?.systemTemplate ?? fileDefault.systemTemplate);
  const [user, setUser] = useState(initialActive?.userTemplate ?? fileDefault.userTemplate);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const allowed = useMemo(() => new Set(variables.map((v) => v.name)), [variables]);
  const unknownVars = useMemo(() => {
    const used = [...extractPlaceholders(system), ...extractPlaceholders(user)];
    return [...new Set(used.filter((u) => !allowed.has(u)))];
  }, [system, user, allowed]);

  function loadInto(s: string, u: string, msg: string) {
    setSystem(s); setUser(u); toast.info(msg);
  }

  async function saveNewVersion() {
    if (unknownVars.length > 0) {
      toast.error(`placeholder ناشناخته: ${unknownVars.map((u) => `{{${u}}}`).join("، ")}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ai/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey, locale, systemTemplate: system, userTemplate: user, note, activate: true }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "خطا در ذخیره."); return; }
      toast.success("نسخهٔ جدید ذخیره و فعال شد");
      setNote("");
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  async function activateVersion(version: number | null) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ai/prompts/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey, locale, version }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "خطا."); return; }
      toast.success(version === null ? "بازگشت به پیش‌فرض فایل انجام شد" : "نسخه فعال شد");
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {/* راهنما */}
      <div className="rounded-xl bg-mist/15 border border-mist/30 px-4 py-3 text-[12px] leading-relaxed text-charcoal">
        <div className="font-semibold text-ink mb-1">چطور این پرامپت را ویرایش کنم؟</div>
        <ul className="list-disc pr-4 space-y-1">
          <li><b>SYSTEM</b> نقش و قوانین AI را تعیین می‌کند؛ <b>USER</b> همان چیزی است که داده‌های کاربر در آن قرار می‌گیرد.</li>
          <li>جاهایی که داده‌ها می‌نشینند با برچسب‌هایی مثل <code dir="ltr" className="text-ember">{"{{...}}"}</code> مشخص شده‌اند. فقط از <b>متغیرهای مجاز</b> (ستون کنار) استفاده کن — متغیر اشتباه قبل از ذخیره به تو هشدار می‌دهد.</li>
          <li>هر بار که ذخیره کنی یک <b>نسخهٔ جدید</b> ساخته و فعال می‌شود؛ نسخه‌های قبلی می‌مانند و هر زمان می‌توانی یکی را دوباره فعال کنی.</li>
          <li>با <b>«بازگشت به فایل»</b> همه‌چیز به متن پیش‌فرض اولیه برمی‌گردد.</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ویرایشگر */}
      <div className="lg:col-span-2 space-y-4">
        <Editor label="متن SYSTEM" value={system} onChange={setSystem} disabled={!canManage} rows={14} />
        <Editor label="متن USER" value={user} onChange={setUser} disabled={!canManage} rows={6} />

        {unknownVars.length > 0 && (
          <p className="text-xs text-ember bg-ember/8 rounded-lg px-3 py-2">
            placeholder ناشناخته: {unknownVars.map((u) => `{{${u}}}`).join("، ")} — قبل از ذخیره اصلاح کن.
          </p>
        )}
        {canManage && (
          <div className="space-y-3 rounded-2xl border border-black/8 bg-white/40 p-4">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="یادداشت این نسخه (اختیاری)"
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={saveNewVersion}
                disabled={busy || unknownVars.length > 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
              >
                {busy && <Spinner />}
                ذخیره و فعال‌سازی نسخهٔ جدید
              </button>
              <button
                onClick={() => loadInto(fileDefault.systemTemplate, fileDefault.userTemplate, "پیش‌فرض فایل در ویرایشگر بارگذاری شد (هنوز ذخیره نشده).")}
                disabled={busy}
                className="px-3 py-2.5 rounded-xl text-sm text-stone hover:bg-black/4 transition-colors"
              >
                بارگذاری پیش‌فرض فایل
              </button>
              {activeVersion !== null && (
                <button
                  onClick={() => activateVersion(null)}
                  disabled={busy}
                  className="px-3 py-2.5 rounded-xl text-sm text-ember hover:bg-ember/8 transition-colors"
                >
                  بازگشت به فایل (غیرفعال‌سازی override)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* کناری: متغیرها + تاریخچهٔ نسخه‌ها */}
      <aside className="space-y-5">
        <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
          <h3 className="text-xs font-semibold text-ink mb-2">متغیرهای مجاز</h3>
          <ul className="space-y-1.5">
            {variables.map((v) => (
              <li key={v.name} className="text-[11px]">
                <code className="text-ember" dir="ltr">{`{{${v.name}}}`}</code>
                <span className="text-fog"> — {v.desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-fog/80 mt-3 leading-relaxed">
            فقط از این متغیرها استفاده کن. متغیر ناشناخته باعث خطای اجرا می‌شود.
          </p>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
          <h3 className="text-xs font-semibold text-ink mb-2">نسخه‌ها</h3>
          {versions.length === 0 ? (
            <p className="text-[11px] text-fog">هنوز overrideی ساخته نشده — پیش‌فرض فایل فعال است.</p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li key={v.version} className="flex items-start justify-between gap-2 text-[11px] border-b border-black/4 last:border-0 pb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-ink fa-num">#{v.version.toLocaleString("fa-IR")}</span>
                      {v.isActive && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sage/15 text-sage-deep">فعال</span>}
                    </div>
                    {v.note && <div className="text-fog truncate">{v.note}</div>}
                    <div className="text-fog/70 fa-num">{v.dateLabel}</div>
                  </div>
                  {canManage && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => loadInto(v.systemTemplate, v.userTemplate, `نسخهٔ #${v.version} در ویرایشگر بارگذاری شد.`)}
                        className="text-[10px] text-stone hover:text-ink"
                      >
                        بارگذاری
                      </button>
                      {!v.isActive && (
                        <button
                          onClick={() => activateVersion(v.version)}
                          disabled={busy}
                          className="text-[10px] text-ember hover:underline"
                        >
                          فعال‌سازی
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
      </div>
    </div>
  );
}

function Editor({ label, value, onChange, disabled, rows }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; rows: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        dir="rtl"
        className="rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage resize-y leading-relaxed font-mono disabled:opacity-60"
      />
    </div>
  );
}
