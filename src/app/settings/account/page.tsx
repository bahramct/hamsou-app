// ─────────────────────────────────────────────────────────────────────────────
// /settings/account — تنظیمات حساب (حذف حساب)
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { DeleteAccountForm } from "@/components/features/settings/DeleteAccountForm";

export default async function AccountSettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { phone: true },
  });
  if (!user) redirect("/login");

  return (
    <AppShell>
      <div className="flex-1 flex justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-sm space-y-8 animate-fade-up">
          <div className="space-y-1">
            <h1 className="text-base text-ink font-semibold">حساب کاربری</h1>
            <p className="text-xs text-fog">مدیریت و حذف حساب</p>
          </div>

          <DeleteAccountForm phone={user.phone} />
        </div>
      </div>
    </AppShell>
  );
}
