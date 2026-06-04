// ─────────────────────────────────────────────────────────────────────────────
// /settings/account — حذف حساب (مدیریتِ هویت/ورود به پروفایل منتقل شد — DECISION-059)
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { DeleteAccountForm } from "@/components/features/settings/DeleteAccountForm";

export default async function AccountSettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { phone: true, email: true },
  });
  if (!user) redirect("/login");

  return (
    <AppShell>
      <div className="flex-1 flex justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-sm space-y-8 animate-fade-up">
          <div className="space-y-1">
            <Link href="/settings/profile" className="text-xs text-stone hover:text-ink transition-colors inline-flex items-center gap-1">
              → بازگشت به پروفایل
            </Link>
            <h1 className="text-base text-ember font-semibold pt-2">حذف حساب</h1>
            <p className="text-xs text-fog">این عملیات قابل بازگشت نیست.</p>
          </div>

          <DeleteAccountForm phone={user.phone} email={user.email} />
        </div>
      </div>
    </AppShell>
  );
}
