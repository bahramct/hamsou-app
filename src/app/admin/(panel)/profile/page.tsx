// ─────────────────────────────────────────────────────────────────────────────
// /admin/profile — پروفایل شخصی ادمین (هر نقشی)
// ویرایش نام نمایشی، نام کاربری، تلفن، آواتار + تغییر رمز.
// بدون نیاز به permission خاص — فقط ادمینِ لاگین‌شده پروفایل خودش را می‌بیند.
// ─────────────────────────────────────────────────────────────────────────────

import { requireAdmin } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { AdminProfileForm } from "@/components/admin/AdminProfileForm";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const ctx = await requireAdmin();
  const me = await prisma.adminUser.findUnique({
    where: { id: ctx.admin.id },
    select: { displayName: true, username: true, phone: true, avatarPreset: true, avatarImage: true },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-xl font-semibold text-ink">پروفایل من</h1>
        <p className="text-sm text-stone mt-1">
          نقش تو: <span className="text-ink">{ctx.role.label}</span>
        </p>
      </header>

      <AdminProfileForm
        initial={{
          displayName: me?.displayName ?? ctx.admin.displayName,
          username: me?.username ?? ctx.admin.username,
          phone: me?.phone ?? "",
          avatarPreset: me?.avatarPreset ?? 0,
          avatarImage: me?.avatarImage ?? null,
        }}
      />
    </div>
  );
}
