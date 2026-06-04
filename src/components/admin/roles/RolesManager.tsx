"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RolesManager — مدیریت نقش‌ها و دسترسی‌ها (DECISION-036)
// ساخت نقش، ویرایش permissionها (تیک گروه‌بندی‌شده)، حذف نقش غیرپایه بدون عضو.
// نقش owner قفل است (همیشه همهٔ دسترسی‌ها). permission مورد نیاز: roles.manage.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export interface RoleData {
  id: string;
  key: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  adminCount: number;
  permissionKeys: string[];
}

export interface PermissionGroupData {
  group: string;
  label: string;
  perms: { key: string; label: string }[];
}

interface Props {
  roles: RoleData[];
  groups: PermissionGroupData[];
}

export function RolesManager({ roles, groups }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">نقش‌ها و دسترسی‌ها</h1>
          <p className="text-sm text-stone mt-1 fa-num">{roles.length.toLocaleString("fa-IR")} نقش</p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="px-4 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
        >
          {showCreate ? "بستن" : "ساخت نقش جدید"}
        </button>
      </header>

      {showCreate && (
        <CreateRoleForm
          onCreated={() => { setShowCreate(false); router.refresh(); }}
        />
      )}

      <div className="space-y-3">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} groups={groups} onChanged={() => router.refresh()} />
        ))}
      </div>
    </div>
  );
}

// ─── فرم ساخت نقش ─────────────────────────────────────────────────────────────
function CreateRoleForm({ onCreated }: { onCreated: () => void }) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, label, description }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "خطا در ساخت نقش."); return; }
      toast.success("نقش جدید ساخته شد");
      onCreated();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/8 bg-white/50 p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-stone">کلید (لاتین)</label>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            dir="ltr"
            placeholder="editor"
            className="rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink text-right focus:outline-none focus:border-sage"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-stone">نام نقش</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-stone">توضیح (اختیاری)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !key.trim() || !label.trim()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {loading && <Spinner />}
          ساخت نقش
        </button>
        <span className="text-[11px] text-fog">پس از ساخت، دسترسی‌ها را از کارت نقش تنظیم کن.</span>
      </div>
    </form>
  );
}

// ─── کارت نقش ─────────────────────────────────────────────────────────────────
function RoleCard({
  role,
  groups,
  onChanged,
}: {
  role: RoleData;
  groups: PermissionGroupData[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isOwner = role.key === "owner";
  const totalPerms = groups.reduce((n, g) => n + g.perms.length, 0);
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissionKeys));
  const [saving, setSaving] = useState(false);

  // owner همیشه همه را دارد (نمایش)
  const effectiveCount = isOwner ? totalPerms : selected.size;

  function toggle(key: string) {
    if (isOwner) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleGroup(g: PermissionGroupData, on: boolean) {
    if (isOwner) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of g.perms) { if (on) next.add(p.key); else next.delete(p.key); }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${role.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "خطا در ذخیره."); return; }
      toast.success("دسترسی‌های نقش ذخیره شد");
      onChanged();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!confirm(`نقش «${role.label}» حذف شود؟`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${role.id}/delete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "خطا در حذف."); return; }
      toast.success("نقش حذف شد");
      onChanged();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl border border-black/8 bg-white/40 overflow-hidden">
      {/* هدر کارت */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-right hover:bg-black/2 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-sm font-semibold text-ink">{role.label}</span>
          {role.isSystem && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/6 text-fog">پایه</span>
          )}
          <span className="text-[11px] text-fog" dir="ltr">{role.key}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-fog fa-num">
            {effectiveCount.toLocaleString("fa-IR")}/{totalPerms.toLocaleString("fa-IR")} دسترسی
          </span>
          <span className="text-[11px] text-fog fa-num">{role.adminCount.toLocaleString("fa-IR")} عضو</span>
          <span className={`text-fog transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
        </div>
      </button>

      {/* بدنه — ویرایش دسترسی‌ها */}
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-black/6">
          {role.description && <p className="text-xs text-stone mt-3 mb-2">{role.description}</p>}

          {isOwner && (
            <p className="text-[11px] text-ember/90 bg-ember/8 rounded-lg px-3 py-2 my-3">
              نقش «مالک سایت» همیشه همهٔ دسترسی‌ها را دارد و قابل تغییر نیست.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-3">
            {groups.map((g) => {
              const all = g.perms.every((p) => isOwner || selected.has(p.key));
              return (
                <div key={g.group}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-stone uppercase tracking-wide">{g.label}</span>
                    {!isOwner && (
                      <button
                        onClick={() => toggleGroup(g, !all)}
                        className="text-[10px] text-ember hover:underline"
                      >
                        {all ? "هیچ‌کدام" : "همه"}
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {g.perms.map((p) => {
                      const checked = isOwner || selected.has(p.key);
                      return (
                        <label
                          key={p.key}
                          className={`flex items-center gap-2 text-sm ${isOwner ? "opacity-60 cursor-default" : "cursor-pointer"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isOwner}
                            onChange={() => toggle(p.key)}
                            className="accent-ember w-4 h-4"
                          />
                          <span className="text-stone">{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!isOwner && (
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
              >
                {saving && <Spinner />}
                ذخیره دسترسی‌ها
              </button>
              {!role.isSystem && role.adminCount === 0 && (
                <button
                  onClick={remove}
                  disabled={saving}
                  className="px-3 py-2 rounded-xl text-sm text-ember hover:bg-ember/8 transition-colors disabled:opacity-40"
                >
                  حذف نقش
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
