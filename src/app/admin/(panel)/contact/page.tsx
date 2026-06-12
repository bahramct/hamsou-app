// ─────────────────────────────────────────────────────────────────────────────
// /admin/contact — پیام‌های فرم «تماس با ما» (DECISION-072) — enforce support.read
// ایمیل فرستنده فقط اینجا دیده می‌شود (در سایت هرگز نمایش داده نمی‌شود).
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import {
  ContactMessagesManager,
  type ContactMessageRow,
} from "@/components/admin/contact/ContactMessagesManager";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const ctx = await requirePermission("support.read");

  const [rows, counts] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.contactMessage.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus: Record<string, number> = {};
  for (const c of counts) countByStatus[c.status] = c._count._all;

  const initial: ContactMessageRow[] = rows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject,
    body: m.body,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink mb-1">پیام‌های تماس</h1>
      <p className="text-xs text-fog mb-5">
        پیام‌های فرم «تماس با ما» — فرستنده‌ها لزوماً کاربر همسو نیستند.
      </p>
      <ContactMessagesManager
        initialMessages={initial}
        initialCounts={countByStatus}
        canDelete={can(ctx, "support.respond")}
      />
    </div>
  );
}
