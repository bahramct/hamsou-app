"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AiSettingsForm — تنظیمات کلید-مقدار AI (DECISION-037)
// نام/متن خوش‌آمد همدم + پارامتر نقش‌ها. (سقف چت per-plan به «مدیریت پلن‌ها» منتقل شد — DECISION-040)
// فقط فیلدهای تغییرکرده ذخیره می‌شوند (override روی پیش‌فرض).
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AI_CONFIG_KEYS, DEFAULT_CHAT_MAX_MESSAGE_LENGTH } from "@/lib/ai/admin-catalog";
import { toEnDigits } from "@/lib/utils/digits";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export interface AiSettingsData {
  current: Record<string, string>;
  defaults: Record<string, string>;
  roles: { key: string; label: string }[];
  canManage: boolean;
}

export function AiSettingsForm({ data }: { data: AiSettingsData }) {
  const router = useRouter();
  const { canManage } = data;

  // مقدار اولیهٔ مؤثر هر کلید = override موجود یا پیش‌فرض
  const initial = useMemo(() => {
    const out: Record<string, string> = {};
    const allKeys = [
      AI_CONFIG_KEYS.companionDefaultName,
      AI_CONFIG_KEYS.chatWelcome,
      AI_CONFIG_KEYS.chatMaxMessageLength,
      ...data.roles.flatMap((r) => [
        AI_CONFIG_KEYS.roleTemperature(r.key),
        AI_CONFIG_KEYS.roleMaxTokens(r.key),
      ]),
    ];
    for (const k of allKeys) {
      if (k === AI_CONFIG_KEYS.chatMaxMessageLength) {
        out[k] = data.current[k] ?? data.defaults[k] ?? String(DEFAULT_CHAT_MAX_MESSAGE_LENGTH);
      } else {
        out[k] = data.current[k] ?? data.defaults[k] ?? "";
      }
    }
    return out;
  }, [data]);

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const dirtyKeys = Object.keys(values).filter((k) => values[k] !== initial[k]);

  async function save() {
    if (dirtyKeys.length === 0) return;
    setSaving(true);
    try {
      const updates = dirtyKeys.map((key) => ({ key, value: values[key] }));
      const res = await fetch("/api/admin/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "خطا در ذخیره."); return; }
      toast.success("تنظیمات ذخیره شد");
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <Guide title="راهنمای این بخش">
        این تنظیمات روی مقادیر «پیش‌فرض» (فایل/سرور) سوار می‌شوند. هر فیلدی را که <b>تغییر ندهی</b>، دقیقاً مثل قبل کار می‌کند.
        پس از تغییر، روی <b>«ذخیره تغییرات»</b> پایین صفحه بزن. اگر چیزی را اشتباه تنظیم کردی، کافی است مقدار درست را دوباره وارد کنی و ذخیره کنی.
        <br />
        <span className="text-fog">مدل، آدرس و کلید سرویس‌دهنده‌ها در دو بخش بالا («سرویس‌دهنده‌های AI» و «اتصال بخش‌ها») مدیریت می‌شوند.</span>
      </Guide>

      {/* همدم و چت */}
      <Section title="همدم و چت" hint="نام پیش‌فرض همدم (وقتی کاربر نام سفارشی نگذاشته) و متن خوش‌آمد.">
        <Guide tone="soft">
          در «متن خوش‌آمد» می‌توانی از دو برچسب استفاده کنی: <code dir="ltr">{"{{NAME}}"}</code> (نام همدم) و <code dir="ltr">{"{{LIMIT}}"}</code> (سقف پیام همان کاربر).
          <br />
          <span className="text-fog">«سقف پیام روزانهٔ همدم» به‌ازای هر پلن، حالا در بخش «مدیریت پلن‌ها» تنظیم می‌شود.</span>
        </Guide>
        <div className="space-y-4 mt-3">
          <TextField label="نام پیش‌فرض همدم" disabled={!canManage}
            value={values[AI_CONFIG_KEYS.companionDefaultName]}
            onChange={(v) => set(AI_CONFIG_KEYS.companionDefaultName, v)} />
          <NumberField
            label="حداکثر طول پیام کاربر (کاراکتر)"
            disabled={!canManage}
            value={values[AI_CONFIG_KEYS.chatMaxMessageLength]}
            onChange={(v) => set(AI_CONFIG_KEYS.chatMaxMessageLength, v)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone">
              متن خوش‌آمد چت <span className="text-fog">— می‌توانی از {"{{NAME}}"} و {"{{LIMIT}}"} استفاده کنی</span>
            </label>
            <textarea
              disabled={!canManage}
              value={values[AI_CONFIG_KEYS.chatWelcome]}
              onChange={(e) => set(AI_CONFIG_KEYS.chatWelcome, e.target.value)}
              rows={4}
              className="rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage resize-y leading-relaxed disabled:opacity-60"
            />
          </div>
        </div>
      </Section>

      {/* پیشرفته — پارامتر نقش‌ها */}
      <Section title="پارامترهای نقش‌ها (پیشرفته)" hint="temperature و سقف توکن خروجی هر نقش." collapsible open={showAdvanced} onToggle={() => setShowAdvanced((v) => !v)}>
        <div className="space-y-4">
          {data.roles.map((r) => (
            <div key={r.key} className="grid grid-cols-2 gap-3 items-end">
              <div className="col-span-2 text-xs font-medium text-stone">{r.label}</div>
              <NumberField label="temperature" step="0.05" disabled={!canManage}
                value={values[AI_CONFIG_KEYS.roleTemperature(r.key)]}
                onChange={(v) => set(AI_CONFIG_KEYS.roleTemperature(r.key), v)} />
              <NumberField label="maxOutputTokens" disabled={!canManage}
                value={values[AI_CONFIG_KEYS.roleMaxTokens(r.key)]}
                onChange={(v) => set(AI_CONFIG_KEYS.roleMaxTokens(r.key), v)} />
            </div>
          ))}
        </div>
      </Section>

      {/* نوار ذخیره */}
      {canManage && (
        <div className="sticky bottom-0 -mx-5 md:-mx-8 px-5 md:px-8 py-3 bg-paper/90 backdrop-blur-sm border-t border-black/8 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving || dirtyKeys.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
          >
            {saving && <Spinner />}
            {`ذخیره تغییرات${dirtyKeys.length ? ` (${dirtyKeys.length.toLocaleString("fa-IR")})` : ""}`}
          </button>
        </div>
      )}
      {!canManage && (
        <p className="text-xs text-fog">نقش تو فقط اجازهٔ مشاهده دارد (ai.read). برای تغییر به ai.manage نیاز است.</p>
      )}
    </div>
  );
}

// ─── اجزای فرم ────────────────────────────────────────────────────────────────
function Section({
  title, hint, children, collapsible = false, open = true, onToggle,
}: {
  title: string; hint?: string; children: React.ReactNode;
  collapsible?: boolean; open?: boolean; onToggle?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <button
        type="button"
        onClick={collapsible ? onToggle : undefined}
        className={`w-full flex items-center justify-between text-right ${collapsible ? "" : "cursor-default"}`}
      >
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {hint && <p className="text-xs text-fog mt-0.5">{hint}</p>}
        </div>
        {collapsible && <span className={`text-fog transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>}
      </button>
      {(!collapsible || open) && <div className="mt-4">{children}</div>}
    </section>
  );
}

function TextField({ label, value, onChange, disabled, dir }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone">{label}</label>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} dir={dir}
        className="rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage disabled:opacity-60"
      />
    </div>
  );
}

function NumberField({ label, value, onChange, disabled, step }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; step?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone">{label}</label>
      <input
        inputMode="decimal" value={value}
        onChange={(e) => onChange(toEnDigits(e.target.value).replace(/[^0-9.]/g, ""))}
        disabled={disabled} dir="ltr"
        data-step={step}
        className="rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink text-right focus:outline-none focus:border-sage disabled:opacity-60"
      />
    </div>
  );
}

function Guide({ title, children, tone = "normal" }: {
  title?: string; children: React.ReactNode; tone?: "normal" | "soft";
}) {
  return (
    <div className={`rounded-xl px-4 py-3 text-[12px] leading-relaxed ${
      tone === "soft" ? "bg-mist/10 text-stone" : "bg-mist/15 text-charcoal border border-mist/30"
    }`}>
      {title && (
        <div className="flex items-center gap-1.5 font-semibold text-ink mb-1">
          <span aria-hidden>؟</span>{title}
        </div>
      )}
      <div className="[&_code]:text-ember [&_b]:text-ink">{children}</div>
    </div>
  );
}

