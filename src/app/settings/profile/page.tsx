// ─────────────────────────────────────────────────────────────────────────────
// /settings/profile — پروفایل کاربری (بازطراحی DECISION-056)
// طراحی: hero رنگی‌شده با رنگ آواتار + نوار آمار + گرید کارت‌ها
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { AvatarSection } from "@/components/features/profile/AvatarSection";
import { PersonalInfoSection } from "@/components/features/profile/PersonalInfoSection";
import { SupportChatCard } from "@/components/features/support-chat/SupportChatCard";
import { getPreset } from "@/lib/profile/avatarPresets";
import { planAllows } from "@/lib/plans/access";
import { LIVE_CHAT_FEATURE_KEY } from "@/lib/support/chat";
import { toFaDigits } from "@/lib/utils/digits";

// ─── فرمت تاریخ عضویت ─────────────────────────────────────────────────────────
function formatMemberSince(date: Date): string {
  return date.toLocaleDateString("fa-IR", { year: "numeric", month: "long" });
}

// ─── badge پلن ────────────────────────────────────────────────────────────────
const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  FREE:  { label: "رایگان", className: "bg-fog/25 text-stone" },
  PLUS:  { label: "پلاس",   className: "bg-sage/20 text-sage-deep" },
  PRO:   { label: "پرو",    className: "bg-ember/15 text-ember" },
};

// ─── صفحه اصلی ────────────────────────────────────────────────────────────────
export default async function ProfileSettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      phone: true,
      displayName: true,
      bio: true,
      companionName: true,
      avatarPreset: true,
      avatarImage: true,
      plan: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/login");

  // آمار مشارکت
  const [entryCount, reportCount] = await Promise.all([
    prisma.dailyEntry.count({ where: { userId: session.userId } }),
    prisma.weeklyReport.count({ where: { userId: session.userId } }),
  ]);
  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000)
  );

  const preset = getPreset(user.avatarPreset);
  const initialLetter = user.displayName?.trim()?.[0] ?? "ه";
  const planBadge = PLAN_BADGE[user.plan] ?? { label: user.plan, className: "bg-fog/25 text-stone" };
  const liveChatAllowed = await planAllows(user.plan, LIVE_CHAT_FEATURE_KEY);

  return (
    <AppShell>
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">

        {/* ───── Hero ───── */}
        <div
          className="relative overflow-hidden glass-strong rounded-3xl p-6 sm:p-8 animate-fade-up"
          style={{
            background: `linear-gradient(135deg, ${preset.bg}28 0%, rgba(255,255,255,0.60) 55%)`,
          }}
        >
          {/* halo محیطی از رنگ آواتار */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full"
            style={{
              background: `radial-gradient(circle, ${preset.bg}38, transparent 65%)`,
            }}
          />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7">
            {/* آواتار */}
            <div
              className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center text-2xl sm:text-3xl font-semibold shadow-paper-md"
              style={user.avatarImage ? {} : { backgroundColor: preset.bg, color: preset.fg }}
            >
              {user.avatarImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarImage} alt="آواتار" className="w-full h-full object-cover" />
              ) : (
                initialLetter
              )}
            </div>

            {/* اطلاعات پایه */}
            <div className="flex-1 text-center sm:text-right">
              <h1 className="text-xl sm:text-2xl font-semibold text-ink leading-tight">
                {user.displayName || "کاربر همسو"}
              </h1>
              <p className="text-sm text-fog mt-1" dir="ltr">
                {toFaDigits(user.phone)}
              </p>
              {user.bio && (
                <p className="text-xs text-stone mt-2 leading-relaxed max-w-sm mx-auto sm:mx-0">
                  {user.bio}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planBadge.className}`}
                >
                  {planBadge.label}
                </span>
                <span className="text-xs text-fog">
                  عضو از {formatMemberSince(user.createdAt)}
                </span>
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

        {/* ───── ردیف اول: اطلاعات شخصی + آواتار ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PersonalInfoSection
            displayName={user.displayName}
            bio={user.bio}
            companionName={user.companionName}
          />
          <AvatarSection
            currentPreset={user.avatarPreset}
            avatarImage={user.avatarImage}
            displayName={user.displayName}
          />
        </div>

        {/* ───── ردیف دوم: پشتیبانی ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SupportEntry />
          <SupportChatCard allowed={liveChatAllowed} />
        </div>

        {/* ───── ردیف سوم: اطلاعات حساب + یادآوری‌ها ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccountInfoCard user={user} />
          <NotificationsCard />
        </div>

      </div>
    </AppShell>
  );
}

// ─── کارت آمار ────────────────────────────────────────────────────────────────
function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center">
      <span className="text-2xl font-semibold text-ink">
        {value.toLocaleString("fa-IR")}
      </span>
      <span className="text-[11px] text-fog leading-tight">{label}</span>
    </div>
  );
}

// ─── اطلاعات حساب ─────────────────────────────────────────────────────────────
function AccountInfoCard({
  user,
}: {
  user: { phone: string; plan: string; createdAt: Date };
}) {
  const PLAN_LABELS: Record<string, string> = {
    FREE: "رایگان",
    PLUS: "پلاس",
    PRO:  "پرو",
  };

  return (
    <section className="glass rounded-2xl p-6 space-y-4">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold text-ink">اطلاعات حساب</h2>
        <p className="text-xs text-fog">قابل تغییر نیست</p>
      </div>
      <dl className="space-y-3">
        <div className="flex items-center justify-between">
          <dt className="text-xs text-fog">شماره موبایل</dt>
          <dd className="text-sm text-stone tracking-wider" dir="ltr">
            {toFaDigits(user.phone)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-xs text-fog">پلن</dt>
          <dd className="text-sm text-stone">{PLAN_LABELS[user.plan] ?? user.plan}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-xs text-fog">عضویت از</dt>
          <dd className="text-sm text-stone">{formatMemberSince(user.createdAt)}</dd>
        </div>
      </dl>
      <div className="pt-2 border-t border-black/5">
        <Link
          href="/settings/account"
          className="text-xs text-fog hover:text-ember transition-colors"
        >
          حذف حساب کاربری
        </Link>
      </div>
    </section>
  );
}

// ─── یادآوری‌ها ───────────────────────────────────────────────────────────────
function NotificationsCard() {
  return (
    <section className="glass rounded-2xl p-6 flex flex-col">
      <div className="space-y-0.5 mb-4">
        <h2 className="text-sm font-semibold text-ink">یادآوری‌ها</h2>
        <p className="text-xs text-fog leading-relaxed">
          رویدادهای مهم مسیر تو — پاسخ پشتیبانی، تغییر پلن و…
        </p>
      </div>
      <Link
        href="/notifications"
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
      >
        مشاهدهٔ یادآوری‌ها
      </Link>
      <p className="text-[11px] text-fog mt-4 pt-4 border-t border-black/5 leading-relaxed">
        تنظیم زمان و نوعِ یادآوری‌ها (روزانه، گزارش هفتگی…) به‌زودی اضافه می‌شود.
      </p>
    </section>
  );
}

// ─── ورودی پشتیبانی ──────────────────────────────────────────────────────────
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
