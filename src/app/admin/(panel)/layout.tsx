// ─────────────────────────────────────────────────────────────────────────────
// /admin/(panel)/layout — قالب صفحات احرازهویت‌شده پنل (DECISION-036)
// requireAdmin: اگر ادمین لاگین نباشد → redirect به /admin/login
// /admin/login بیرون از این گروه است، پس گرفتار حلقه redirect نمی‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth-server";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSupportNavCounts } from "@/lib/support/nav-counts";
import { prisma } from "@/lib/db/client";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAdmin();

  // اجبار تغییر رمز در ورود اول — صفحه change-password بیرون از این گروه است (بدون حلقه)
  if (ctx.admin.mustChangePassword) redirect("/admin/change-password");

  // مقدار اولیهٔ badgeهای سایدبار — هرکدام فقط برای دارندهٔ دسترسیِ مربوط
  const support = ctx.permissions.has("support.read")
    ? await getSupportNavCounts()
    : { openTickets: 0, unreadChats: 0 };
  const pendingPayments = ctx.permissions.has("payment.read")
    ? await prisma.walletTransaction.count({ where: { type: "topup", status: "pending" } })
    : 0;
  const initialCounts = { ...support, pendingPayments };

  return (
    <AdminShell
      admin={{ displayName: ctx.admin.displayName, username: ctx.admin.username, avatarPreset: ctx.admin.avatarPreset, avatarImage: ctx.admin.avatarImage }}
      role={{ label: ctx.role.label }}
      permissions={[...ctx.permissions]}
      initialCounts={initialCounts}
    >
      {children}
    </AdminShell>
  );
}
