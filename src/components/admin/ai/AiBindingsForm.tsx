"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AiBindingsForm — اتصال هر بخش سیستم به یک سرویس، per منطقه (DECISION-039)
// «پیش‌فرض منطقه» = خالی → از سرویس پیش‌فرض همان منطقه/نوع استفاده می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ServiceOpt {
  id: string;
  label: string;
  region: string;
  kind: string;
  isActive: boolean;
}

interface RoleConsumer {
  key: string;
  label: string;
  serviceKind: string;
}

interface Props {
  roles: RoleConsumer[];
  regions: { key: string; label: string }[];
  services: ServiceOpt[];
  /** key = `${roleKey}.${region}` → serviceId (یا "") */
  bindings: Record<string, string>;
  canManage: boolean;
}

export function AiBindingsForm({ roles, regions, services, bindings, canManage }: Props) {
  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <h2 className="text-sm font-semibold text-ink mb-1">اتصال بخش‌ها به سرویس‌ها</h2>
      <p className="text-xs text-fog mb-3">
        تعیین کن هر بخش سیستم برای کاربران هر منطقه از کدام سرویس استفاده کند. اگر «پیش‌فرض منطقه» را بگذاری، از سرویس پیش‌فرض همان منطقه استفاده می‌شود.
      </p>

      <div className="rounded-xl bg-mist/15 border border-mist/30 px-4 py-3 text-[12px] leading-relaxed text-charcoal mb-5">
        مثال: می‌توانی «همدم (چت)» را برای کاربران ایران به سرویس متنی الف، و گزارش هفتگی را به سرویس متنی ب وصل کنی. هر بخش فقط سرویس‌های <b>هم‌نوع خودش</b> (متنی/تصویری) را نشان می‌دهد.
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.key} className="rounded-xl border border-black/8 bg-white/50 p-4">
            <div className="text-sm font-medium text-ink mb-3">
              {role.label}
              <span className="text-[11px] text-fog mr-2">— سرویس {role.serviceKind === "text" ? "متنی" : "تصویری"}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {regions.map((region) => (
                <BindingSelect
                  key={region.key}
                  roleKey={role.key}
                  region={region}
                  serviceKind={role.serviceKind}
                  services={services.filter(
                    (s) => s.region === region.key && s.kind === role.serviceKind && s.isActive
                  )}
                  current={bindings[`${role.key}.${region.key}`] ?? ""}
                  canManage={canManage}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BindingSelect({
  roleKey, region, services, current, canManage,
}: {
  roleKey: string;
  region: { key: string; label: string };
  serviceKind: string;
  services: ServiceOpt[];
  current: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function change(next: string) {
    const prev = value;
    setValue(next);
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/ai/bindings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey, region: region.key, serviceId: next }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "خطا."); setValue(prev); return; }
      router.refresh();
    } catch { setError("اتصال برقرار نشد."); setValue(prev); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-stone">{region.label}</label>
      <select
        value={value}
        disabled={!canManage || busy}
        onChange={(e) => change(e.target.value)}
        dir="rtl"
        className="rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage disabled:opacity-60"
      >
        <option value="">پیش‌فرض منطقه</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      {error && <span className="text-[10px] text-ember">{error}</span>}
    </div>
  );
}
