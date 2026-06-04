// ─────────────────────────────────────────────────────────────────────────────
// /admin/roles — مدیریت نقش‌ها و دسترسی‌ها (enforce: roles.manage) — DECISION-036
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { ADMIN_PERMISSIONS, PERMISSION_GROUPS } from "@/lib/admin/permissions";
import { RolesManager } from "@/components/admin/roles/RolesManager";
import type { RoleData, PermissionGroupData } from "@/components/admin/roles/RolesManager";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requirePermission("roles.manage");

  const roles = await prisma.adminRole.findMany({
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      key: true,
      label: true,
      description: true,
      isSystem: true,
      _count: { select: { admins: true } },
      permissions: { select: { permission: { select: { key: true } } } },
    },
  });

  const roleData: RoleData[] = roles.map((r) => ({
    id: r.id,
    key: r.key,
    label: r.label,
    description: r.description,
    isSystem: r.isSystem,
    adminCount: r._count.admins,
    permissionKeys: r.permissions.map((p) => p.permission.key),
  }));

  // کاتالوگ permission گروه‌بندی‌شده برای UI
  const groups: PermissionGroupData[] = Object.entries(PERMISSION_GROUPS).map(
    ([group, label]) => ({
      group,
      label,
      perms: ADMIN_PERMISSIONS.filter((p) => p.group === group).map((p) => ({
        key: p.key,
        label: p.label,
      })),
    })
  );

  return <RolesManager roles={roleData} groups={groups} />;
}
