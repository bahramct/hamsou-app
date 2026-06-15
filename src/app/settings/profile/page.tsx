// ─────────────────────────────────────────────────────────────────────────────
// /settings/profile — پروفایل کاربری (بازطراحی DECISION-057/059/062)
// hero با آواتارِ قابل‌ویرایش + @username · کارتِ یکپارچهٔ هویت/ورود
// + بخش کیف‌پول (زمان باقی‌مانده پلن + موجودی + کارت‌ها + تراکنش‌های اخیر)
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { EditableAvatar } from "@/components/features/profile/EditableAvatar";
import { PersonalInfoSection } from "@/components/features/profile/PersonalInfoSection";
import { IdentityCard } from "@/components/features/profile/IdentityCard";
import { PlanTile } from "@/components/features/profile/PlanTile";
import { RemindersTile } from "@/components/features/profile/RemindersTile";
import { SetPasswordModal } from "@/components/features/profile/SetPasswordModal";
import { SupportCenter, type TicketSummary } from "@/components/features/support/SupportCenter";
import { ProfileWalletSection, type ProfileWalletTx } from "@/components/features/wallet/ProfileWalletSection";
import { AVATAR_COLOR } from "@/lib/profile/avatarPresets";
import { planAllows } from "@/lib/plans/access";
import { TICKETING_FEATURE_KEY } from "@/lib/support/tickets";
import { toFaDigits } from "@/lib/utils/digits";
import { getEffectivePlan } from "@/lib/plans/effective";
import { isOnboardingEnabled } from "@/lib/settings/site";

function formatMemberSince(date: Date): string {
  return date.toLocaleDateString("fa-IR", { year: "numeric", month: "long" });
}

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  FREE: { label: "رایگان", className: "bg-fog/25 text-stone" },
  PLUS: { label: "پلاس", className: "bg-sage/20 text-sage-deep" },
  PRO:  { label: "پرو", className: "bg-ember/15 text-ember" },
};

function daysLeftLabel(daysLeft: number | null): string | null {
  if (daysLeft == null) return null;
  if (daysLeft === 0) return "امروز منقضی می‌شود";
  if (daysLeft === 1) return "۱ روز مانده";
  return `${daysLeft.toLocaleString("fa-IR")} روز مانده`;
}

export default async function ProfileSettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      phone: true,
      email: true,
      emailVerifiedAt: true,
      username: true,
      passwordHash: true,
      onboardedAt: true,
      displayName: true,
      bio: true,
      companionName: true,
      avatarImage: true,
      birthDate: true,
      plan: true,
      planExpiresAt: true,
      planCycle: true,
      createdAt: true,
      walletBalance: true,
      paymentCardNumber: true,
      paymentCardNumber2: true,
    },
  });
  if (!user) redirect("/login");

  // پلن مؤثر (با lazy-downgrade + چک ۳ روز)
  const effectivePlan = await getEffectivePlan(session.userId);

  // تراکنش‌های اخیر (۲۰ تا برای مودال؛ ۴ تای اول در تایل) + تیکت‌های پشتیبانی (برای دراور)
  const [recentTxsRaw, ticketsRaw] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.supportTicket.findMany({
      where: { userId: session.userId },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      select: { id: true, subject: true, category: true, status: true, lastMessageAt: true },
    }),
  ]);

  // کاربرِ ایمیلی که هنوز رمز عبور ندارد → مودالِ قفل (DECISION-080)
  const needsPassword = !!user.email && !!user.emailVerifiedAt && !user.passwordHash;

  // کاربرِ تازه‌وارد که رمزش را ست کرده اما هنوز onboarding ندیده → سفرِ onboarding.
  // فقط اگر سفرِ onboarding از پنل روشن باشد (هم‌ترازی سایت↔پنل، DECISION-088).
  // کاربرانِ قدیمی backfill شده‌اند، پس بازدیدِ معمولِ پروفایل اینجا ریدایرکت نمی‌شود (DECISION-085).
  if (!needsPassword && !user.onboardedAt && (await isOnboardingEnabled())) redirect("/onboarding");

  const color = AVATAR_COLOR;
  const initialLetter = user.displayName?.trim()?.[0] ?? "ه";
  const planBadge = PLAN_BADGE[effectivePlan.plan] ?? { label: effectivePlan.plan, className: "bg-fog/25 text-stone" };
  const ticketingAllowed = await planAllows(effectivePlan.plan, TICKETING_FEATURE_KEY);
  const daysLeftStr = daysLeftLabel(effectivePlan.daysLeft);

  const recentTxs: ProfileWalletTx[] = recentTxsRaw.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    status: t.status,
    refCode: t.refCode,
    createdAt: t.createdAt.toISOString(),
  }));

  const tickets: TicketSummary[] = ticketsRaw.map((t) => ({
    id: t.id,
    subject: t.subject,
    category: t.category,
    status: t.status,
    lastMessageAt: t.lastMessageAt.toISOString(),
  }));

  return (
    <AppShell>
      {needsPassword && <SetPasswordModal userDisplayName={user.displayName} />}
      <div className="pf-wrap animate-fade-up">

        {/* ───── Hero (دست‌نخورده) + ورودیِ کیف‌پول ───── */}
        <div
          className="relative overflow-hidden glass-strong rounded-3xl p-6 sm:p-8"
          style={{ background: `linear-gradient(135deg, ${color.bg}28 0%, rgba(var(--rgb-card),0.60) 55%)` }}
        >
          {/* ورودیِ کیف‌پول — آیکونِ فلتِ وکتوری + موجودی (در گوشهٔ خالیِ بالا-چپ) */}
          <a className="pf-wallet-mini" href="#finance" title="کیف‌پول">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H18a2 2 0 0 1 2 2v1H6a1 1 0 0 0 0 2h14a1 1 0 0 1 1 1v4a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5v-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="16.5" cy="13.5" r="1.1" fill="currentColor" /></svg>
            <span className="wm-label">کیف‌پول</span>
            <span className="wm-bal fa-num">{user.walletBalance.toLocaleString("fa-IR")} <i>تومان</i></span>
          </a>

          <div
            className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full"
            style={{ background: `radial-gradient(circle, ${color.bg}38, transparent 65%)` }}
          />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7">
            <EditableAvatar avatarImage={user.avatarImage} fallbackLetter={initialLetter} />

            <div className="flex-1 text-center sm:text-right">
              <h1 className="text-xl sm:text-2xl font-semibold text-ink leading-tight">
                {user.displayName || "کاربر همسو"}
              </h1>
              {user.username && (
                <p className="text-sm text-sage-deep font-medium mt-0.5 num-latin" dir="ltr">
                  @{user.username}
                </p>
              )}
              {(user.phone || user.email) && (
                <p className="text-sm text-fog mt-1 num-latin" dir="ltr">
                  {user.phone ? toFaDigits(user.phone) : user.email}
                </p>
              )}
              {user.bio && (
                <p className="text-xs text-stone mt-2 leading-relaxed max-w-sm mx-auto sm:mx-0">
                  {user.bio}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planBadge.className}`}>
                  {planBadge.label}
                </span>
                {user.planCycle && effectivePlan.plan !== "FREE" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-fog/15 text-stone">
                    {user.planCycle === "annual" ? "سالانه" : "ماهانه"}
                  </span>
                )}
                {/* زمان باقی‌مانده پلن */}
                {daysLeftStr && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs ${
                    (effectivePlan.daysLeft ?? 99) <= 3 ? "bg-ember/10 text-ember" : "bg-fog/20 text-stone"
                  }`}>
                    {(effectivePlan.daysLeft ?? 99) <= 3 && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    )}
                    {daysLeftStr}
                  </span>
                )}
                <span className="text-xs text-fog">عضو از {formatMemberSince(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ───── جداکنندهٔ بخش ───── */}
        <div className="pf-section-head">
          <h2>حساب من</h2>
          <span className="rule" />
        </div>

        {/* ───── بِنتوِ حساب ───── */}
        <div className="pf-bento">
          <IdentityCard
            phone={user.phone}
            email={user.email}
            emailVerified={user.emailVerifiedAt !== null}
            username={user.username}
            hasPassword={user.passwordHash !== null}
          />
          <PersonalInfoSection
            displayName={user.displayName}
            bio={user.bio}
            birthDate={user.birthDate ? user.birthDate.toISOString().split("T")[0] : ""}
          />
          <PlanTile
            planLabel={planBadge.label}
            planKey={effectivePlan.plan}
            cycle={user.planCycle}
            daysLeft={effectivePlan.daysLeft}
          />
          <ProfileWalletSection
            balance={user.walletBalance}
            cardNumber={user.paymentCardNumber}
            cardNumber2={user.paymentCardNumber2}
            recentTxs={recentTxs}
          />
          <RemindersTile />
          <SupportCenter ticketingAllowed={ticketingAllowed} initialTickets={tickets} />
        </div>

      </div>
    </AppShell>
  );
}

