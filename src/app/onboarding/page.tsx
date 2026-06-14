// ─────────────────────────────────────────────────────────────────────────────
// /onboarding — سفرِ رواییِ تمام‌صفحهٔ کاربرِ تازه‌وارد (DECISION-085)
//
// Server Component:
//   ● session را می‌خواند؛ بدون session → /login
//   ● اگر کاربر قبلاً onboard شده (onboardedAt ≠ null) → /dashboard (گارد)
//   ● نامِ پیش‌فرضِ همدم را از تنظیماتِ ادمین می‌خواند (هم‌ترازی)
// طراحی: ۴ پرده آرام، شخصی‌سازیِ هویت (نام تو + نام همدم)، پایان = هدایت به اولین تعهد.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { AmbientField } from "@/components/layout/AmbientField";
import { OnboardingFlow } from "@/components/features/onboarding/OnboardingFlow";
import { getAiConfig } from "@/lib/ai/config";
import { AI_CONFIG_KEYS, DEFAULT_COMPANION_NAME } from "@/lib/ai/admin-catalog";

export default async function OnboardingPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  // خواندنِ کاربر و پیش‌فرضِ همدم به‌صورت موازی — کاهشِ تأخیرِ بارگذاری (DECISION-087)
  const [user, defaultCompanionName] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { displayName: true, companionName: true, onboardedAt: true },
    }),
    getAiConfig(AI_CONFIG_KEYS.companionDefaultName, DEFAULT_COMPANION_NAME),
  ]);
  if (!user) redirect("/login");

  // گارد: کاربری که سفر را تمام/رد کرده دیگر آن را نمی‌بیند
  if (user.onboardedAt) redirect("/dashboard");

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-5">
      <AmbientField />
      <OnboardingFlow
        initialDisplayName={user.displayName ?? ""}
        initialCompanionName={user.companionName ?? ""}
        defaultCompanionName={defaultCompanionName}
      />
    </main>
  );
}
