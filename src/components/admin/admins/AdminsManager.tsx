"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminsManager — مدیریت ادمین‌ها (DECISION-038)
// مالک: ویرایش پروفایل، بازنشانی رمز، حذف، انتقال مالکیت (DECISION-082)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { compressImage } from "@/lib/utils/compress-image";

export interface AdminRow {
  id: string;
  username: string;
  displayName: string;
  phone: string | null;
  avatarImage: string | null;
  mustChangePassword: boolean;
  roleKey: string;
  roleLabel: string;
  isOwner: boolean;
  isActive: boolean;
  lastLoginLabel: string | null;
  createdLabel: string;
  isSelf: boolean;
}

export interface RoleOption {
  key: string;
  label: string;
}

interface Props {
  admins: AdminRow[];
  roles: RoleOption[];
  isOwnerViewing: boolean;
}

export function AdminsManager({ admins, roles, isOwnerViewing }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);
  const [editTarget, setEditTarget] = useState<AdminRow | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRow | null>(null);
  const [transferTarget, setTransferTarget] = useState<AdminRow | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminRow | null>(null);

  function refresh() { router.refresh(); }

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
            refresh();
          }}
        />
      )}

      <AdminsTable
        admins={admins}
        roles={roles}
        isOwnerViewing={isOwnerViewing}
        onChanged={refresh}
        onEdit={setEditTarget}
        onReset={setResetTarget}
        onDelete={setDeleteTarget}
        onTransfer={setTransferTarget}
        onChangeRole={setRoleTarget}
      />

      {/* modalها */}
      {created && <PasswordModal data={created} onClose={() => setCreated(null)} />}
      {editTarget && (
        <EditAdminModal
          admin={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); refresh(); }}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal
          admin={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteAdminModal
          admin={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); refresh(); }}
        />
      )}
      {transferTarget && (
        <TransferOwnershipModal
          admin={transferTarget}
          onClose={() => setTransferTarget(null)}
          onTransferred={() => { setTransferTarget(null); refresh(); }}
        />
      )}
      {roleTarget && (
        <ChangeRoleModal
          admin={roleTarget}
          roles={roles}
          onClose={() => setRoleTarget(null)}
          onChanged={() => { setRoleTarget(null); refresh(); }}
        />
      )}
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
  isOwnerViewing,
  onChanged,
  onEdit,
  onReset,
  onDelete,
  onTransfer,
  onChangeRole,
}: {
  admins: AdminRow[];
  roles: RoleOption[];
  isOwnerViewing: boolean;
  onChanged: () => void;
  onEdit: (a: AdminRow) => void;
  onReset: (a: AdminRow) => void;
  onDelete: (a: AdminRow) => void;
  onTransfer: (a: AdminRow) => void;
  onChangeRole: (a: AdminRow) => void;
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
            {isOwnerViewing && (
              <th className="text-right font-medium px-4 py-3">عملیات</th>
            )}
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => (
            <AdminRowItem
              key={a.id}
              admin={a}
              roles={roles}
              isOwnerViewing={isOwnerViewing}
              onChanged={onChanged}
              onEdit={onEdit}
              onReset={onReset}
              onDelete={onDelete}
              onTransfer={onTransfer}
              onChangeRole={onChangeRole}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminRowItem({
  admin,
  roles,
  isOwnerViewing,
  onChanged,
  onEdit,
  onReset,
  onDelete,
  onTransfer,
  onChangeRole,
}: {
  admin: AdminRow;
  roles: RoleOption[];
  isOwnerViewing: boolean;
  onChanged: () => void;
  onEdit: (a: AdminRow) => void;
  onReset: (a: AdminRow) => void;
  onDelete: (a: AdminRow) => void;
  onTransfer: (a: AdminRow) => void;
  onChangeRole: (a: AdminRow) => void;
}) {
  const [busy, setBusy] = useState(false);

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
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          {/* آواتار کوچک */}
          <div
            className="shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-medium"
            style={{ background: "rgba(var(--rgb-sage),0.18)", color: "var(--color-sage-deep)" }}
          >
            {admin.avatarImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={admin.avatarImage} alt={admin.displayName} className="w-full h-full object-cover" />
            ) : (
              admin.displayName.charAt(0)
            )}
          </div>
          <div>
            <div className="text-ink text-sm">
              {admin.displayName}
              {admin.isSelf && <span className="mr-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-black/6 text-fog">شما</span>}
              {admin.mustChangePassword && (
                <span className="mr-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">رمز موقت</span>
              )}
            </div>
            <div className="text-[11px] text-fog fa-num">عضو از {admin.createdLabel}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-stone hidden sm:table-cell num-latin" dir="ltr">{admin.username}</td>
      <td className="px-4 py-3">
        {admin.isOwner ? (
          <span className="inline-flex items-center gap-1 text-xs text-ink">
            {admin.roleLabel}
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ember/10 text-ember">مالک</span>
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-ink">{admin.roleLabel}</span>
            {isOwnerViewing && !admin.isSelf && (
              <button
                onClick={() => onChangeRole(admin)}
                disabled={busy}
                title="تغییر نقش"
                className="w-6 h-6 rounded-full flex items-center justify-center bg-black/5 text-stone hover:bg-black/10 hover:text-ink transition-colors disabled:opacity-40"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                  <path d="M2 8h3.5M10.5 8H14M8 2v3.5M8 10.5V14" />
                  <circle cx="8" cy="8" r="2.5" />
                </svg>
              </button>
            )}
          </div>
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

      {/* ستون عملیات — فقط مالک */}
      {isOwnerViewing && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {/* ویرایش */}
            <ActionBtn
              title="ویرایش پروفایل"
              onClick={() => onEdit(admin)}
              color="text-stone hover:text-ink"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M2.695 14.762l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 6.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
            </ActionBtn>

            {/* بازنشانی رمز */}
            <ActionBtn
              title="بازنشانی رمز عبور"
              onClick={() => onReset(admin)}
              color="text-amber-600 hover:text-amber-700"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
            </ActionBtn>

            {/* حذف — نه مالک، نه خود */}
            {!admin.isOwner && !admin.isSelf && (
              <ActionBtn
                title="حذف این ادمین"
                onClick={() => onDelete(admin)}
                color="text-ember hover:text-ember/80"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                </svg>
              </ActionBtn>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

function ActionBtn({
  children,
  onClick,
  title,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg hover:bg-black/5 transition-colors ${color}`}
    >
      {children}
    </button>
  );
}

// ─── modal نمایش یک‌بارهٔ رمز (ساخت ادمین) ──────────────────────────────────
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
    <Modal onClose={onClose}>
      <h2 className="text-base font-semibold text-ink mb-1">ادمین ساخته شد</h2>
      <p className="text-xs text-stone leading-relaxed mb-4">
        این رمز فقط همین یک‌بار نمایش داده می‌شود. آن را کپی کن و به کاربر بده.
      </p>
      <div className="space-y-2 mb-5">
        <Field label="نام کاربری" value={data.username} />
        <Field label="رمز عبور موقت" value={data.password} mono />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={copy} className="flex-1 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors">
          کپی رمز
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-stone hover:bg-black/5 transition-colors">
          بستن
        </button>
      </div>
    </Modal>
  );
}

// ─── modal ویرایش پروفایل ادمین (مالک) ───────────────────────────────────────
const AVATAR_MAX_W = 400;
const AVATAR_QUALITY = 0.85;

function EditAdminModal({
  admin,
  onClose,
  onSaved,
}: {
  admin: AdminRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(admin.displayName);
  const [username, setUsername] = useState(admin.username);
  const [phone, setPhone] = useState(admin.phone ?? "");
  const [avatar, setAvatar] = useState<string | null>(admin.avatarImage);
  const [mustChange, setMustChange] = useState(admin.mustChangePassword);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("فقط فایل تصویری مجاز است."); return; }
    try {
      const dataUrl = await compressImage(file, AVATAR_MAX_W, AVATAR_QUALITY);
      setAvatar(dataUrl);
    } catch {
      toast.error("پردازش تصویر انجام نشد.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    if (busy) return;
    if (!displayName.trim()) { toast.error("نام نمایشی الزامی است."); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          username: username.trim(),
          phone: phone.trim(),
          avatarImage: avatar,
          mustChangePassword: mustChange,
        }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "ذخیره نشد."); return; }
      toast.success("پروفایل ادمین بروز شد.");
      onSaved();
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} wide>
      <h2 className="text-base font-semibold text-ink mb-4">ویرایش پروفایل ادمین</h2>

      {/* آواتار */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-medium shrink-0"
          style={{ background: "rgba(var(--rgb-sage),0.18)", color: "var(--color-sage-deep)" }}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            displayName.charAt(0)
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs bg-black/5 text-stone hover:bg-black/10 transition-colors"
          >
            تغییر تصویر
          </button>
          {avatar && (
            <button
              onClick={() => setAvatar(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-ember hover:bg-ember/10 transition-colors"
            >
              حذف تصویر
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarFile} className="hidden" />
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div>
          <label className="text-xs font-medium text-stone block mb-1">نام نمایشی</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-stone block mb-1">نام کاربری</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            dir="ltr"
            className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink text-right focus:outline-none focus:border-sage num-latin"
          />
          <p className="text-[11px] text-fog mt-1">فقط حروف لاتین، عدد، نقطه، خط تیره و زیرخط</p>
        </div>
        <div>
          <label className="text-xs font-medium text-stone block mb-1">شماره موبایل <span className="font-normal text-fog">(اختیاری)</span></label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            dir="ltr"
            className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink text-right focus:outline-none focus:border-sage num-latin"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} />
          <span className="text-sm text-stone">اجبار تغییر رمز در ورود بعدی</span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={busy || !displayName.trim()}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {busy && <Spinner size={14} />}
          ذخیره تغییرات
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-stone hover:bg-black/5 transition-colors">
          انصراف
        </button>
      </div>
    </Modal>
  );
}

// ─── modal بازنشانی رمز عبور (مالک) ─────────────────────────────────────────
function ResetPasswordModal({
  admin,
  onClose,
}: {
  admin: AdminRow;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ username: string; password: string } | null>(null);

  async function doReset() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}/reset-password`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "بازنشانی انجام نشد."); return; }
      setResult({ username: d.username, password: d.password });
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast.neutral("کپی شد"); }
    catch { toast.error("کپی ناموفق بود"); }
  }

  if (result) {
    return (
      <Modal onClose={onClose}>
        <h2 className="text-base font-semibold text-ink mb-1">رمز بازنشانی شد</h2>
        <p className="text-xs text-stone leading-relaxed mb-4">
          این رمز فقط همین یک‌بار نمایش داده می‌شود. آن را کپی کن و در جای امن نگه‌دار.
        </p>
        <div className="space-y-2 mb-5">
          <Field label="نام کاربری" value={result.username} />
          <Field label="رمز عبور جدید" value={result.password} mono />
        </div>
        <div className="flex gap-2">
          <button onClick={() => copy(result.password)} className="flex-1 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors">
            کپی رمز
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-stone hover:bg-black/5 transition-colors">
            بستن
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-base font-semibold text-ink mb-2">بازنشانی رمز عبور</h2>
      <p className="text-sm text-stone leading-relaxed mb-1">
        رمز عبور <strong>{admin.displayName}</strong> ({admin.username}) بازنشانی می‌شود.
      </p>
      <p className="text-xs text-fog leading-relaxed mb-5">
        رمز فعلی باطل و یک رمز جدید تولید می‌شود. ادمین باید در اولین ورود بعدی آن را تغییر دهد.
        <br />
        رمزهای ذخیره‌شده به‌صورت hash هستند و قابل نمایش نیستند — تنها بازنشانی ممکن است.
      </p>
      <div className="flex gap-2">
        <button
          onClick={doReset}
          disabled={busy}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-40"
        >
          {busy && <Spinner size={14} />}
          بازنشانی رمز
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-stone hover:bg-black/5 transition-colors">
          انصراف
        </button>
      </div>
    </Modal>
  );
}

// ─── modal حذف ادمین (مالک) ───────────────────────────────────────────────────
function DeleteAdminModal({
  admin,
  onClose,
  onDeleted,
}: {
  admin: AdminRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const isConfirmed = confirm.trim() === admin.username;

  async function doDelete() {
    if (!isConfirmed || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "حذف انجام نشد."); return; }
      toast.success("حساب ادمین حذف شد.");
      onDeleted();
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-base font-semibold text-ember mb-2">حذف حساب ادمین</h2>
      <p className="text-sm text-stone leading-relaxed mb-3">
        حساب <strong>{admin.displayName}</strong> ({admin.username}) به‌طور کامل حذف خواهد شد.
        این عملیات غیرقابل بازگشت است.
      </p>
      <div className="mb-4">
        <label className="text-xs font-medium text-stone block mb-1.5">
          برای تأیید، نام کاربری را تایپ کن:
          <span className="mr-1 font-mono text-ink">{admin.username}</span>
        </label>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          dir="ltr"
          placeholder={admin.username}
          className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink text-right focus:outline-none focus:border-ember num-latin"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={doDelete}
          disabled={!isConfirmed || busy}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-ember text-white text-sm font-medium hover:bg-ember/90 transition-colors disabled:opacity-40"
        >
          {busy && <Spinner size={14} />}
          حذف دائمی
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-stone hover:bg-black/5 transition-colors">
          انصراف
        </button>
      </div>
    </Modal>
  );
}

// ─── modal انتقال مالکیت (مالک) ──────────────────────────────────────────────
function TransferOwnershipModal({
  admin,
  onClose,
  onTransferred,
}: {
  admin: AdminRow;
  onClose: () => void;
  onTransferred: () => void;
}) {
  const CONFIRM_TEXT = "مالکیت را منتقل کن";
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const isConfirmed = confirm.trim() === CONFIRM_TEXT;

  async function doTransfer() {
    if (!isConfirmed || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}/transfer-ownership`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "انتقال انجام نشد."); return; }
      toast.success("مالکیت منتقل شد. نقش شما به ادمین تغییر کرد.");
      onTransferred();
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-sage-deep">
            <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v11.505a20.1 20.1 0 013.78.501.75.75 0 11-.339 1.462A18.6 18.6 0 0010 17.75a18.6 18.6 0 00-4.191.482.75.75 0 11-.34-1.462 20.1 20.1 0 013.781-.501V4.509a31.742 31.742 0 00-3.339.254l1.77 7.85a.75.75 0 01-.387.83A4.981 4.981 0 015 14a4.98 4.98 0 01-2.294-.556.75.75 0 01-.387-.832L4.02 5.067c-.37.07-.735.148-1.103.232a.75.75 0 01-.336-1.462 33.186 33.186 0 016.668-.829V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-ink">انتقال مالکیت سایت</h2>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-4 text-xs text-amber-800 leading-relaxed space-y-1">
        <div className="font-semibold">هشدار: عملیات غیرقابل بازگشت</div>
        <div>
          پس از انتقال، <strong>{admin.displayName}</strong> ({admin.username}) مالک جدید سایت می‌شود
          و شما به نقش «ادمین سیستم» تنزل پیدا می‌کنید.
        </div>
        <div>تنها راه بازگشت این است که مالک جدید مجدداً مالکیت را به شما منتقل کند.</div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-stone block mb-1.5">
          برای تأیید این جمله را کلمه به کلمه تایپ کن:
        </label>
        <div className="text-sm font-medium text-ink mb-2 p-2 rounded-lg bg-black/5 text-center tracking-wide">
          {CONFIRM_TEXT}
        </div>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={CONFIRM_TEXT}
          className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink text-center focus:outline-none focus:border-sage"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={doTransfer}
          disabled={!isConfirmed || busy}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sage-deep text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {busy && <Spinner size={14} />}
          انتقال مالکیت
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-stone hover:bg-black/5 transition-colors">
          انصراف
        </button>
      </div>
    </Modal>
  );
}

// ─── modal تغییر نقش ادمین (مالک) ────────────────────────────────────────────
function ChangeRoleModal({
  admin,
  roles,
  onClose,
  onChanged,
}: {
  admin: AdminRow;
  roles: RoleOption[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [roleKey, setRoleKey] = useState(admin.roleKey);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy || roleKey === admin.roleKey) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "خطا در تغییر نقش."); return; }
      toast.success("نقش ادمین تغییر کرد");
      onChanged();
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-base font-semibold text-ink mb-3">تغییر نقش ادمین</h2>
      <p className="text-sm text-stone mb-4">
        نقش <strong>{admin.displayName}</strong> ({admin.username}) را انتخاب کن:
      </p>
      <div className="flex flex-col gap-2 mb-5">
        {roles.filter((r) => r.key !== "owner").map((r) => (
          <label
            key={r.key}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              roleKey === r.key
                ? "border-sage/40 bg-sage/8 text-ink"
                : "border-black/8 bg-white/40 text-stone hover:border-black/15"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={r.key}
              checked={roleKey === r.key}
              onChange={() => setRoleKey(r.key)}
              className="accent-sage-deep"
            />
            <span className="text-sm">{r.label}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={busy || roleKey === admin.roleKey}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {busy && <Spinner size={14} />}
          ذخیره نقش
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-stone hover:bg-black/5 transition-colors">
          انصراف
        </button>
      </div>
    </Modal>
  );
}

// ─── کامپوننت‌های کمکی ────────────────────────────────────────────────────────
function Modal({
  children,
  onClose,
  wide = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full rounded-2xl bg-paper border border-black/10 p-6 shadow-paper-md ${wide ? "max-w-md" : "max-w-sm"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
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
