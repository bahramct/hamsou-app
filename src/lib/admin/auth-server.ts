// ─────────────────────────────────────────────────────────────────────────────
// admin/auth-server.ts — خواندن session ادمین در سرور + permission guard
//
// استفاده:
//   - Server Components / Layouts → getAdminSession() یا requireAdmin()
//   - API Route Handlers          → getAdminSession() + can() / requirePermission()
//   - Client Components           → هرگز import نکن (server-only)
//
// permissionها در هر فراخوانی از DB خوانده می‌شوند (DECISION-036) تا تغییر نقش
// فوری اعمال شود.
// ─────────────────────────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "./session";
import type { PermissionKey } from "./permissions";

export interface AdminContext {
  admin: {
    id: string;
    username: string;
    displayName: string;
    avatarPreset: number;
    avatarImage: string | null;
    isActive: boolean;
    mustChangePassword: boolean;
  };
  role: {
    id: string;
    key: string;
    label: string;
  };
  /** مجموعه permission keyهای فعال این ادمین */
  permissions: Set<string>;
}

/**
 * خواندن و resolve کامل session ادمین از cookie + DB.
 * @returns AdminContext یا null اگر session نبود/نامعتبر بود/ادمین غیرفعال شد
 */
export async function getAdminSession(): Promise<AdminContext | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return null;

    const result = await verifyAdminSessionToken(token);
    if (!result.valid) return null;

    const admin = await prisma.adminUser.findUnique({
      where: { id: result.payload.adminId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: { select: { key: true } } } },
          },
        },
      },
    });

    // ادمین حذف یا غیرفعال شده → session بی‌اعتبار
    if (!admin || !admin.isActive) return null;

    const permissions = new Set(
      admin.role.permissions.map((rp) => rp.permission.key)
    );

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        avatarPreset: admin.avatarPreset,
        avatarImage: admin.avatarImage,
        isActive: admin.isActive,
        mustChangePassword: admin.mustChangePassword,
      },
      role: { id: admin.role.id, key: admin.role.key, label: admin.role.label },
      permissions,
    };
  } catch {
    return null;
  }
}

/** آیا این context permission مشخصی دارد؟ */
export function can(ctx: AdminContext | null, perm: PermissionKey): boolean {
  return !!ctx && ctx.permissions.has(perm);
}

/**
 * آیا این ادمین «مالک» است؟ — برای اقدامات فقط-Owner (مثل مشاهدهٔ کلید API خام).
 * مبنا: key نقش، نه permission (DECISION-039).
 */
export function isOwner(ctx: AdminContext | null): boolean {
  return !!ctx && ctx.role.key === "owner";
}

/**
 * گارد صفحه/لایه: اگر ادمین لاگین نیست → redirect به /admin/login.
 * @returns AdminContext تضمین‌شده غیر-null
 */
export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminSession();
  if (!ctx) redirect("/admin/login");
  return ctx;
}

/**
 * گارد صفحه با permission: لاگین نیست → /admin/login، دسترسی ندارد → /admin/denied.
 */
export async function requirePermission(
  perm: PermissionKey
): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!ctx.permissions.has(perm)) redirect("/admin/denied");
  return ctx;
}
