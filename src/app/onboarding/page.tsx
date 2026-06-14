// ─────────────────────────────────────────────────────────────────────────────
// /onboarding — سفرِ خوش‌آمدگوییِ کاربرِ تازه‌وارد (DECISION-085/088/089)
//
// Server Component:
//   ● session را می‌خواند؛ بدون session → /login
//   ● اگر سفرِ onboarding از پنل خاموش است → /dashboard (هم‌ترازی سایت↔پنل)
//   ● اگر کاربر قبلاً onboard شده (onboardedAt ≠ null) → /dashboard (گارد)
//   ● اسلایدها از پیکربندیِ مدیریت‌شده (AppSetting) خوانده می‌شوند — DECISION-089
// طراحی: سبکِ Notion — پس‌زمینهٔ تمیز، پرده‌های تک‌تمرکز، قابلِ مدیریت از پنل.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { OnboardingFlow } from "@/components/features/onboarding/OnboardingFlow";
import { isOnboardingEnabled } from "@/lib/settings/site";
import { getOnboardingConfig } from "@/lib/onboarding/config";

export default async function OnboardingPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  // خواندنِ موازی — کاهشِ تأخیرِ بارگذاری (DECISION-087)
  const [user, onboardingEnabled, config] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { displayName: true, onboardingMotive: true, onboardedAt: true },
    }),
    isOnboardingEnabled(),
    getOnboardingConfig(),
  ]);
  if (!user) redirect("/login");

  // گِیتِ پنل: اگر onboarding خاموش است، اصلاً نمایش داده نمی‌شود (DECISION-088)
  if (!onboardingEnabled) redirect("/dashboard");

  // گارد: کاربری که سفر را تمام/رد کرده دیگر آن را نمی‌بیند
  if (user.onboardedAt) redirect("/dashboard");

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-5 bg-paper">
      <OnboardingFlow
        slides={config.slides}
        initialDisplayName={user.displayName ?? ""}
        initialMotive={user.onboardingMotive ?? ""}
      />
    </main>
  );
}
