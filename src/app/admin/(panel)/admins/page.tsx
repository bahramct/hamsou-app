// ─────────────────────────────────────────────────────────────────────────────
// /admin/admins — مدیریت ادمین‌ها (enforce: admins.manage) — DECISION-038
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { AdminsManager } from "@/components/admin/admins/AdminsManager";
import type { AdminRow, RoleOption } from "@/components/admin/admins/AdminsManager";

export const dynamic = "force-dynamic";

function faDateTime(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tehran" });
}

export default async function AdminsPage() {
  const ctx = await requirePermission("admins.manage");

  const [adminRows, roles] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        displayName: true,
        isActive: true,
        lastLoginAt: true,
        role: { select: { key: true } },
      },
    }),
    prisma.adminRole.findMany({ orderBy: { isSystem: "desc" }, select: { key: true, label: true } }),
  ]);

  const roleLabelByKey = new Map(roles.map((r) => [r.key, r.label]));

  const admins: AdminRow[] = adminRows.map((a) => ({
    id: a.id,
    username: a.username,
    displayName: a.displayName,
    roleKey: a.role.key,
    roleLabel: roleLabelByKey.get(a.role.key) ?? a.role.key,
    isOwner: a.role.key === "owner",
    isActive: a.isActive,
    lastLoginLabel: faDateTime(a.lastLoginAt),
    isSelf: a.id === ctx.admin.id,
  }));

  // نقش «مالک سایت» قابل تخصیص نیست → از گزینه‌های ساخت/تغییر نقش حذف می‌شود (نکتهٔ مالک).
  const roleOptions: RoleOption[] = roles
    .filter((r) => r.key !== "owner")
    .map((r) => ({ key: r.key, label: r.label }));

  return <AdminsManager admins={admins} roles={roleOptions} />;
}
