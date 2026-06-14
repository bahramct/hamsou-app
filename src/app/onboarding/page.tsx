// ─────────────────────────────────────────────────────────────────────────────
// /onboarding — سفرِ خوش‌آمدگوییِ کاربرِ تازه‌وارد (DECISION-085/088)
//
// Server Component:
//   ● session را می‌خواند؛ بدون session → /login
//   ● اگر سفرِ onboarding از پنل خاموش است → /dashboard (هم‌ترازی سایت↔پنل)
//   ● اگر کاربر قبلاً onboard شده (onboardedAt ≠ null) → /dashboard (گارد)
//   ● نامِ پیش‌فرضِ همدم را از تنظیماتِ ادمین می‌خواند (هم‌ترازی)
// طراحی (DECISION-088): سبکِ Notion — پس‌زمینهٔ آرام و تمیز، پرده‌های تک‌تمرکز،
// یک پرسشِ شخصی‌سازِ راهبردی، شخصی‌سازیِ هویت، پایان = هدایت به اولین تعهد.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { OnboardingFlow } from "@/components/features/onboarding/OnboardingFlow";
import { getAiConfig } from "@/lib/ai/config";
import { AI_CONFIG_KEYS, DEFAULT_COMPANION_NAME } from "@/lib/ai/admin-catalog";
import { isOnboardingEnabled } from "@/lib/settings/site";

export default async function OnboardingPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  // خواندنِ موازی — کاهشِ تأخیرِ بارگذاری (DECISION-087)
  const [user, defaultCompanionName, onboardingEnabled] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { displayName: true, companionName: true, onboardingMotive: true, onboardedAt: true },
    }),
    getAiConfig(AI_CONFIG_KEYS.companionDefaultName, DEFAULT_COMPANION_NAME),
    isOnboardingEnabled(),
  ]);
  if (!user) redirect("/login");

  // گِیتِ پنل: اگر onboarding خاموش است، اصلاً نمایش داده نمی‌شود (DECISION-088)
  if (!onboardingEnabled) redirect("/dashboard");

  // گارد: کاربری که سفر را تمام/رد کرده دیگر آن را نمی‌بیند
  if (user.onboardedAt) redirect("/dashboard");

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-5 bg-paper">
      <OnboardingFlow
        initialDisplayName={user.displayName ?? ""}
        initialCompanionName={user.companionName ?? ""}
        initialMotive={user.onboardingMotive ?? ""}
        defaultCompanionName={defaultCompanionName}
      />
    </main>
  );
}
