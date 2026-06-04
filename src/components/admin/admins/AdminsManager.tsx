"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminsManager — مدیریت ادمین‌ها (DECISION-038)
// ساخت ادمین (رمز auto-generate، نمایش یک‌باره با کپی)، تغییر نقش، فعال/غیرفعال.
// permission مورد نیاز: admins.manage (صفحه enforce می‌کند).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export interface AdminRow {
  id: string;
  username: string;
  displayName: string;
  roleKey: string;
  roleLabel: string;
  isOwner: boolean;
  isActive: boolean;
  lastLoginLabel: string | null;
  isSelf: boolean;
}

export interface RoleOption {
  key: string;
  label: string;
}

interface Props {
  admins: AdminRow[];
  roles: RoleOption[];
}

export function AdminsManager({ admins, roles }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">ادمین‌ها</h1>
          <p className="text-sm text-stone mt-1 fa-num">{admins.length.toLocaleString("fa-IR")} حساب</p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="px-4 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
        >
          {showCreate ? "بستن" : "ساخت ادمین جدید"}
        </button>
      </header>

      {showCreate && (
        <CreateForm
          roles={roles}
          onCreated={(res) => {
            setShowCreate(false);
            setCreated(res);
            router.refresh();
          }}
        />
      )}

      <AdminsTable admins={admins} roles={roles} onChanged={() => router.refresh()} />

      {created && <PasswordModal data={created} onClose={() => setCreated(null)} />}
    </div>
  );
}

// ─── فرم ساخت ─────────────────────────────────────────────────────────────────
function CreateForm({
  roles,
  onCreated,
}: {
  roles: RoleOption[];
  onCreated: (res: { username: string; password: string }) => void;
}) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleKey, setRoleKey] = useState(roles.find((r) => r.key !== "owner")?.key ?? roles[0]?.key ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, roleKey }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "خطا در ساخت ادمین."); return; }
      toast.success("ادمین جدید ساخته شد");
      onCreated({ username: data.username, password: data.password });
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/8 bg-white/50 p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-stone">نام کاربری</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            dir="ltr"
            placeholder="latin، عدد، . _ -"
            className="rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink text-right focus:outline-none focus:border-sage num-latin"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-stone">نام نمایشی</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-stone">نقش</label>
          <select
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage"
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !username.trim() || !displayName.trim()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {loading && <Spinner />}
          ساخت و تولید رمز
        </button>
        <span className="text-[11px] text-fog">رمز پیچیده به‌صورت خودکار ساخته و یک‌بار نمایش داده می‌شود.</span>
      </div>
    </form>
  );
}

// ─── جدول ─────────────────────────────────────────────────────────────────────
function AdminsTable({
  admins,
  roles,
  onChanged,
}: {
  admins: AdminRow[];
  roles: RoleOption[];
  onChanged: () => void;
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white/40 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/6 text-[11px] text-fog">
            <th className="text-right font-medium px-4 py-3">نام</th>
            <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">نام کاربری</th>
            <th className="text-right font-medium px-4 py-3">نقش</th>
            <th className="text-right font-medium px-4 py-3 hidden md:table-cell">آخرین ورود</th>
            <th className="text-right font-medium px-4 py-3">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => (
            <AdminRowItem key={a.id} admin={a} roles={roles} onChanged={onChanged} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminRowItem({
  admin,
  roles,
  onChanged,
}: {
  admin: AdminRow;
  roles: RoleOption[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function changeRole(roleKey: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "خطا در تغییر نقش."); return; }
      toast.success("نقش ادمین تغییر کرد");
      onChanged();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  async function toggleActive() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !admin.isActive }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "خطا."); return; }
      toast.success(admin.isActive ? "ادمین غیرفعال شد" : "ادمین فعال شد");
      onChanged();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <tr className="border-b border-black/4 last:border-0">
      <td className="px-4 py-3 text-ink">
        {admin.displayName}
        {admin.isSelf && <span className="mr-2 text-[9px] px-1.5 py-0.5 rounded-full bg-black/6 text-fog">شما</span>}
      </td>
      <td className="px-4 py-3 text-stone hidden sm:table-cell num-latin" dir="ltr">{admin.username}</td>
      <td className="px-4 py-3">
        {admin.isOwner ? (
          // نقش «مالک سایت» تغییرناپذیر و یکتاست (نکتهٔ مالک)
          <span className="inline-flex items-center gap-1 text-xs text-ink">
            {admin.roleLabel}
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ember/10 text-ember">قفل</span>
          </span>
        ) : (
          <select
            value={admin.roleKey}
            disabled={admin.isSelf || busy}
            onChange={(e) => changeRole(e.target.value)}
            className="rounded-lg px-2 py-1 text-xs bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        )}
      </td>
      <td className="px-4 py-3 text-fog text-xs hidden md:table-cell fa-num">{admin.lastLoginLabel ?? "—"}</td>
      <td className="px-4 py-3">
        {admin.isOwner ? (
          <span className="text-xs px-3 py-1 rounded-full bg-sage/15 text-sage-deep">فعال</span>
        ) : (
          <button
            onClick={toggleActive}
            disabled={admin.isSelf || busy}
            className={`text-xs px-3 py-1 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              admin.isActive
                ? "bg-sage/15 text-sage-deep hover:bg-sage/25"
                : "bg-ember/10 text-ember hover:bg-ember/20"
            }`}
          >
            {admin.isActive ? "فعال" : "غیرفعال"}
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── modal نمایش یک‌بارهٔ رمز ──────────────────────────────────────────────────
function PasswordModal({
  data,
  onClose,
}: {
  data: { username: string; password: string };
  onClose: () => void;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(data.password);
      toast.neutral("رمز کپی شد");
    } catch {
      toast.error("کپی ناموفق بود");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-paper border border-black/10 p-6 shadow-paper-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-ink mb-1">ادمین ساخته شد</h2>
        <p className="text-xs text-stone leading-relaxed mb-4">
          این رمز فقط همین یک‌بار نمایش داده می‌شود. آن را کپی کن و به کاربر بده. کاربر در اولین ورود باید رمز خودش را بسازد.
        </p>

        <div className="space-y-2 mb-5">
          <Field label="نام کاربری" value={data.username} />
          <Field label="رمز عبور موقت" value={data.password} mono />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copy}
            className="flex-1 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
          >
            کپی رمز
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm text-stone hover:bg-black/5 transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-white/60 border border-bone px-3 py-2">
      <div className="text-[10px] text-fog mb-0.5">{label}</div>
      <div className={`text-sm text-ink num-latin ${mono ? "font-mono tracking-wide" : ""}`} dir="ltr">{value}</div>
    </div>
  );
}
