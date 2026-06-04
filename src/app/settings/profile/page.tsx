// ─────────────────────────────────────────────────────────────────────────────
// /settings/profile — پروفایل کاربری (بازطراحی DECISION-057/059)
// hero با آواتارِ قابل‌ویرایش + @username · کارتِ یکپارچهٔ هویت/ورود · چیدمانِ متوازن
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { EditableAvatar } from "@/components/features/profile/EditableAvatar";
import { PersonalInfoSection } from "@/components/features/profile/PersonalInfoSection";
import { IdentityCard } from "@/components/features/profile/IdentityCard";
import { SupportChatCard } from "@/components/features/support-chat/SupportChatCard";
import { AVATAR_COLOR } from "@/lib/profile/avatarPresets";
import { planAllows } from "@/lib/plans/access";
import { LIVE_CHAT_FEATURE_KEY } from "@/lib/support/chat";
import { toFaDigits } from "@/lib/utils/digits";

function formatMemberSince(date: Date): string {
  return date.toLocaleDateString("fa-IR", { year: "numeric", month: "long" });
}

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  FREE: { label: "رایگان", className: "bg-fog/25 text-stone" },
  PLUS: { label: "پلاس", className: "bg-sage/20 text-sage-deep" },
  PRO:  { label: "پرو", className: "bg-ember/15 text-ember" },
};

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
      createdAt: true,
    },
  });
  if (!user) redirect("/login");

  const [entryCount, reportCount] = await Promise.all([
    prisma.dailyEntry.count({ where: { userId: session.userId } }),
    prisma.weeklyReport.count({ where: { userId: session.userId } }),
  ]);
  const daysSince = Math.max(0, Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000));

  const color = AVATAR_COLOR;
  const initialLetter = user.displayName?.trim()?.[0] ?? "ه";
  const planBadge = PLAN_BADGE[user.plan] ?? { label: user.plan, className: "bg-fog/25 text-stone" };
  const liveChatAllowed = await planAllows(user.plan, LIVE_CHAT_FEATURE_KEY);

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
            companionName={user.companionName}
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

        {/* ───── ردیف دوم: پشتیبانی ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <SupportEntry />
          <SupportChatCard allowed={liveChatAllowed} />
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

function SupportEntry() {
  return (
    <section className="glass rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold text-ink">پشتیبانی</h2>
        <p className="text-xs text-fog leading-relaxed">
          سؤال یا مشکلی داری؟ تیکت بفرست و گفتگو را همان‌جا پیگیری کن.
        </p>
      </div>
      <Link
        href="/support"
        className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
      >
        تیکت‌های پشتیبانی
      </Link>
    </section>
  );
}
