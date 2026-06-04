// ─────────────────────────────────────────────────────────────────────────────
// admin/audit.ts — ثبت لاگ تغییرناپذیر اعمال ادمین (DECISION-026 §۷، DECISION-036)
//
// هر عمل حساس ادمین (تغییر پلن، ban، login، …) باید لاگ شود.
// AuditLog فقط append است؛ هیچ‌جای کد آن را update/delete نمی‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";

export interface AuditEntry {
  actorId: string;
  action: string; // "user.plan.change" | "user.ban" | "admin.login" | ...
  targetType?: string; // "user" | "admin" | "plan" | ...
  targetId?: string;
  meta?: Record<string, unknown>;
}

/**
 * ثبت یک رویداد در AuditLog. خطای ثبت لاگ نباید جریان اصلی را بشکند
 * (لاگ می‌شود ولی throw نمی‌شود).
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        meta: entry.meta ? JSON.stringify(entry.meta) : null,
      },
    });
  } catch (err) {
    console.error("[audit] ثبت لاگ ناموفق:", entry.action, err);
  }
}
