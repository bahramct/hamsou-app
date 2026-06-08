// ─────────────────────────────────────────────────────────────────────────────
// /settings/profile — پروفایل کاربری (بازطراحی DECISION-057/059/062)
// hero با آواتارِ قابل‌ویرایش + @username · کارتِ یکپارچهٔ هویت/ورود
// + بخش کیف‌پول (زمان باقی‌مانده پلن + موجودی + کارت‌ها + تراکنش‌های اخیر)
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { EditableAvatar } from "@/components/features/profile/EditableAvatar";
import { PersonalInfoSection } from "@/components/features/profile/PersonalInfoSection";
import { IdentityCard } from "@/components/features/profile/IdentityCard";
import { SupportSection } from "@/components/features/support-chat/SupportSection";
import { ProfileWalletSection, type ProfileWalletTx } from "@/components/features/wallet/ProfileWalletSection";
import { AVATAR_COLOR } from "@/lib/profile/avatarPresets";
import { planAllows } from "@/lib/plans/access";
import { LIVE_CHAT_FEATURE_KEY } from "@/lib/support/chat";
import { TICKETING_FEATURE_KEY } from "@/lib/support/tickets";
import { toFaDigits } from "@/lib/utils/digits";
import { getEffectivePlan } from "@/lib/plans/effective";
import { getNow } from "@/lib/dev/time";

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
      displayName: true,
      bio: true,
      companionName: true,
      avatarImage: true,
      birthDate: true,
      plan: true,
      planExpiresAt: true,
      createdAt: true,
      walletBalance: true,
      paymentCardNumber: true,
      paymentCardNumber2: true,
    },
  });
  if (!user) redirect("/login");

  // پلن مؤثر (با lazy-downgrade + چک ۳ روز)
  const effectivePlan = await getEffectivePlan(session.userId);
  const now = getNow();

  const [entryCount, reportCount, recentTxsRaw] = await Promise.all([
    prisma.dailyEntry.count({ where: { userId: session.userId } }),
    prisma.weeklyReport.count({ where: { userId: session.userId } }),
    prisma.walletTransaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const daysSince = Math.max(0, Math.floor((now.getTime() - user.createdAt.getTime()) / 86_400_000));

  const color = AVATAR_COLOR;
  const initialLetter = user.displayName?.trim()?.[0] ?? "ه";
  const planBadge = PLAN_BADGE[effectivePlan.plan] ?? { label: effectivePlan.plan, className: "bg-fog/25 text-stone" };
  const [liveChatAllowed, ticketingAllowed] = await Promise.all([
    planAllows(effectivePlan.plan, LIVE_CHAT_FEATURE_KEY),
    planAllows(effectivePlan.plan, TICKETING_FEATURE_KEY),
  ]);
  const daysLeftStr = daysLeftLabel(effectivePlan.daysLeft);

  const recentTxs: ProfileWalletTx[] = recentTxsRaw.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    status: t.status,
    refCode: t.refCode,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <AppShell>
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">

        {/* ───── Hero ───── */}
        <div
          className="relative overflow-hidden glass-strong rounded-3xl p-6 sm:p-8 animate-fade-up"
          style={{ background: `linear-gradient(135deg, ${color.bg}28 0%, rgba(255,255,255,0.60) 55%)` }}
        >
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

        {/* ───── نوار آمار ───── */}
        <div className="grid grid-cols-3 gap-3 stagger" style={{ animationDelay: "80ms" }}>
          <StatCard value={entryCount} label="تعهد ثبت‌شده" />
          <StatCard value={reportCount} label="گزارش هفتگی" />
          <StatCard value={daysSince} label="روز همراهی" />
        </div>

        {/* ───── ردیف اول: اطلاعات شخصی + هویت و ورود ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <PersonalInfoSection
            displayName={user.displayName}
            bio={user.bio}
            birthDate={user.birthDate ? user.birthDate.toISOString().split("T")[0] : ""}
          />
          <IdentityCard
            phone={user.phone}
            email={user.email}
            emailVerified={user.emailVerifiedAt !== null}
            username={user.username}
            hasPassword={user.passwordHash !== null}
          />
        </div>

        {/* ───── ردیف دوم: کیف‌پول + پشتیبانی ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <ProfileWalletSection
            balance={user.walletBalance}
            cardNumber={user.paymentCardNumber}
            cardNumber2={user.paymentCardNumber2}
            recentTxs={recentTxs}
          />
          <SupportSection ticketingAllowed={ticketingAllowed} liveChatAllowed={liveChatAllowed} />
        </div>

        {/* ───── ردیف سوم: یادآوری‌ها ───── */}
        <NotificationsCard />

      </div>
    </AppShell>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center">
      <span className="text-2xl font-semibold text-ink">{value.toLocaleString("fa-IR")}</span>
      <span className="text-[11px] text-fog leading-tight">{label}</span>
    </div>
  );
}

function NotificationsCard() {
  return (
    <section className="glass rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold text-ink">یادآوری‌ها</h2>
        <p className="text-xs text-fog leading-relaxed max-w-md">
          رویدادهای مهم مسیر تو — پاسخ پشتیبانی، تغییر پلن و… . تنظیم زمان و نوعِ یادآوری‌های روزانه و هفتگی به‌زودی اضافه می‌شود.
        </p>
      </div>
      <Link
        href="/notifications"
        className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
      >
        مشاهدهٔ یادآوری‌ها
      </Link>
    </section>
  );
}

