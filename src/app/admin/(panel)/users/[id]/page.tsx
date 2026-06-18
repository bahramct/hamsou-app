// ─────────────────────────────────────────────────────────────────────────────
// /admin/users/[id] — جزئیات کاربر (بازطراحی DECISION-060)
// hero مطابق پروفایل سایت · ستون چپ: تیکت + چت · ستون راست: هویت + اقدامات
// enforce: users.read (مشاهده). اکشن‌ها: users.plan.write / users.ban
// حریم خصوصی (DECISION-026 §۷): محتوای تعهد/چت هرگز نمایش داده نمی‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { UserActions } from "@/components/admin/users/UserActions";
import { EmailActions } from "@/components/admin/users/EmailActions";
import { toFaDigits } from "@/lib/utils/digits";
import { AVATAR_COLOR } from "@/lib/profile/avatarPresets";
import { StatusBadge, CategoryLabel } from "@/components/features/support/badges";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { countCommitments } from "@/lib/stats/commitments";
import { planAllows } from "@/lib/plans/access";
import { LIVE_CHAT_FEATURE_KEY } from "@/lib/support/chat";
import { TICKETING_FEATURE_KEY } from "@/lib/support/tickets";
import { getNow } from "@/lib/dev/time";
import { getOnboardingConfig, motiveLabelFromConfig } from "@/lib/onboarding/config";
import { AdminWalletCharge } from "@/components/admin/users/AdminWalletCharge";

export const dynamic = "force-dynamic";

// ── ثابت‌ها ───────────────────────────────────────────────────────────────────
const PLAN_LABELS: Record<string, string> = { FREE: "رایگان", PLUS: "پلاس", PRO: "پرو" };

function daysLeftLabel(daysLeft: number): string {
  if (daysLeft === 0) return "امروز منقضی می‌شود";
  if (daysLeft === 1) return "۱ روز مانده";
  return `${daysLeft.toLocaleString("fa-IR")} روز مانده`;
}

const PLAN_BADGE: Record<string, string> = {
  FREE: "bg-black/7 text-stone",
  PLUS: "bg-sage/20 text-sage-deep",
  PRO:  "bg-ember/12 text-ember",
};

const CHAT_STATUS: Record<string, { label: string; cls: string }> = {
  open:     { label: "باز",           cls: "bg-mist/20 text-mist"  },
  closed:   { label: "بسته",          cls: "bg-black/7 text-stone" },
  bot_only: { label: "بدون پشتیبان",  cls: "bg-gold/15 text-gold"  },
};

// ── کمکی‌ها ───────────────────────────────────────────────────────────────────
function toFa(n: number) { return n.toLocaleString("fa-IR"); }
function faDate(d: Date) {
  return d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Tehran" });
}
function faDateTime(d: Date) {
  return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" });
}
function faDateFromKey(dayKey: string) {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("users.read");
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, phone: true, email: true, emailVerifiedAt: true,
      username: true, passwordHash: true, displayName: true, bio: true,
      avatarImage: true, plan: true, planCycle: true, planExpiresAt: true, isBanned: true, createdAt: true, companionName: true, birthDate: true, onboardingMotive: true, walletBalance: true,
      _count: { select: { gaps: true, weeklyReports: true, chatMessages: true } },
    },
  });
  if (!user) notFound();

  // آخرین تیکت‌ها + آخرین سشن‌های چت + دسترسی پلن (همان planAllows سایت — هم‌ترازی)
  const now = getNow();
  const [recentTickets, recentChatAll, commitmentCount, ticketingAllowed, liveChatAllowed, activeFreeze, onbConfig] =
    await Promise.all([
      prisma.supportTicket.findMany({
        where: { userId: id },
        orderBy: { lastMessageAt: "desc" },
        take: 3,
        select: { id: true, subject: true, status: true, category: true, priority: true, lastMessageAt: true, createdAt: true },
      }),
      prisma.supportChatSession.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, dayKey: true, status: true, lastUserAt: true, createdAt: true, _count: { select: { messages: true } } },
      }),
      // «تعهدها» = روزهای دارای تعهد، بدون روزهای داخل بازه‌های فاصله (DECISION-074)
      countCommitments(id),
      planAllows(user.plan, TICKETING_FEATURE_KEY),
      planAllows(user.plan, LIVE_CHAT_FEATURE_KEY),
      // فریز فعال (DECISION-083)
      prisma.gapRecord.findFirst({
        where: {
          userId: id,
          type: "freeze",
          fromDate: { lte: now },
          toDate: { gte: now },
        },
        select: { id: true, fromDate: true, toDate: true, note: true },
      }),
      // پیکربندیِ onboarding — برای resolveِ برچسبِ انگیزهٔ ورود (هم‌ترازی، DECISION-089)
      getOnboardingConfig(),
    ]);

  const recentChats = liveChatAllowed ? recentChatAll : [];

  const stats = [
    { label: "تعهدها",       value: commitmentCount           },
    { label: "فاصله‌ها",     value: user._count.gaps          },
    { label: "گزارش هفتگی", value: user._count.weeklyReports },
    { label: "پیام چت",     value: user._count.chatMessages  },
  ];

  const ac = AVATAR_COLOR;
  const initLetter = user.displayName?.trim()?.[0] ?? user.phone?.[0] ?? user.email?.[0] ?? "؟";

  // روزهای باقیمانده پلن (فقط برای نمایش در ادمین)
  let adminDaysLeft: number | null = null;
  if (user.plan !== "FREE" && user.planExpiresAt) {
    const msLeft = user.planExpiresAt.getTime() - now.getTime();
    adminDaysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <AutoRefresh intervalMs={10_000} />

      {/* بازگشت */}
      <Link
        href="/admin/users"
        className="text-xs text-stone hover:text-ink transition-colors inline-flex items-center gap-1.5"
      >
        <span className="opacity-50">←</span>
        بازگشت به لیست
      </Link>

      {/* ─── Hero — دقیقاً مطابق پروفایل سایت ──────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7"
        style={{
          background: `linear-gradient(135deg, ${ac.bg}24 0%, rgba(var(--rgb-card),0.68) 58%)`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.07), inset 0 0 0 1px rgba(var(--rgb-card),0.7), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        {/* هاله تزئینی */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-60 h-60 rounded-full"
          style={{ background: `radial-gradient(circle, ${ac.bg}38, transparent 65%)` }}
        />

        <div className="relative flex items-center gap-5 sm:gap-6">
          {/* آواتار */}
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-semibold shrink-0"
            style={user.avatarImage ? {} : { backgroundColor: ac.bg, color: ac.fg }}
          >
            {user.avatarImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarImage} alt="آواتار" className="w-full h-full object-cover" />
            ) : (
              initLetter
            )}
          </div>

          {/* اطلاعات */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-ink leading-tight">
                {user.displayName || "بدون نام"}
              </h1>
              {user.isBanned && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-ember/12 text-ember font-medium">
                  مسدود
                </span>
              )}
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${PLAN_BADGE[user.plan] ?? "bg-black/7 text-stone"}`}>
                {PLAN_LABELS[user.plan] ?? user.plan}
              </span>
              {user.planCycle && user.plan !== "FREE" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-fog/15 text-stone font-medium">
                  {user.planCycle === "annual" ? "سالانه" : "ماهانه"}
                </span>
              )}
              {adminDaysLeft !== null && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  adminDaysLeft <= 3 ? "bg-ember/10 text-ember" : "bg-fog/15 text-stone"
                }`}>
                  {daysLeftLabel(adminDaysLeft)}
                </span>
              )}
            </div>

            {user.username && (
              <p className="text-sm text-sage-deep font-medium mt-0.5 num-latin" dir="ltr">
                @{user.username}
              </p>
            )}
            <p className="text-sm text-fog mt-0.5 num-latin" dir="ltr">
              {user.phone ? toFaDigits(user.phone) : user.email ?? "—"}
            </p>
            {user.bio && (
              <p className="text-xs text-stone mt-1.5 leading-relaxed max-w-sm">{user.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2">
              <p className="text-xs text-fog/60">عضو از {faDate(user.createdAt)}</p>
              {user.birthDate && (
                <p className="text-xs text-fog/60">تولد: {faDate(user.birthDate)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── فریز فعال ───────────────────────────────────────────────────────── */}
      {activeFreeze && (
        <div className="rounded-2xl border border-mist/40 bg-mist/15 px-4 py-3 flex items-center gap-3">
          <span className="text-mist-deep">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="6" y="4" width="4" height="16" rx="1.5" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" rx="1.5" fill="currentColor" />
            </svg>
          </span>
          <div>
            <p className="text-[12px] font-medium text-mist-deep">
              فریز فعال تا {activeFreeze.toDate.toLocaleDateString("fa-IR")}
            </p>
            {activeFreeze.note && (
              <p className="text-[11px] text-stone mt-0.5">{activeFreeze.note}</p>
            )}
          </div>
        </div>
      )}

      {/* ─── آمار ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-black/8 bg-white/50 p-4 text-center">
            <div className="text-xl font-bold text-ink">{toFa(s.value)}</div>
            <div className="text-[11px] text-fog mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── دو ستون اصلی ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5 items-start">

        {/* ─ ستون راست — هویت + اطلاعات + اکشن‌ها (کمی باریک‌تر) ─ */}
        <div className="col-span-12 lg:col-span-5 space-y-4">

          {/* هویت و راه‌های ورود */}
          <section className="rounded-2xl border border-black/8 bg-white/45 p-5 space-y-3">
            <h2 className="text-xs font-semibold text-ink">هویت و ورود</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <Meta
                label="موبایل"
                value={user.phone ? toFaDigits(user.phone) : "ثبت نشده"}
                muted={!user.phone} ltr
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-fog">ایمیل</span>
                {user.email ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-ink num-latin" dir="ltr">{user.email}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      user.emailVerifiedAt ? "bg-sage/15 text-sage-deep" : "bg-ember/10 text-ember"
                    }`}>
                      {user.emailVerifiedAt ? "تأیید‌شده" : "تأیید‌نشده"}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-fog/60">ثبت نشده</span>
                )}
              </div>
              <Meta
                label="نام کاربری"
                value={user.username ? `@${user.username}` : "ثبت نشده"}
                muted={!user.username} ltr
              />
              <Meta
                label="رمز عبور"
                value={user.passwordHash ? "تنظیم‌شده" : "تنظیم نشده"}
                muted={!user.passwordHash}
              />
            </div>
          </section>

          {/* اطلاعات کلی */}
          <section className="rounded-2xl border border-black/8 bg-white/45 p-5 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <Meta label="پلن فعلی"      value={PLAN_LABELS[user.plan] ?? user.plan} />
            <Meta label="تاریخ عضویت"   value={faDateTime(user.createdAt)} />
            <Meta label="نام همدم"      value={user.companionName || "همدم"} />
            <Meta label="انگیزهٔ ورود"  value={motiveLabelFromConfig(onbConfig, user.onboardingMotive) || "—"} />
            <Meta label="بیو"           value={user.bio || "—"} />
          </section>

          {/* وضعیت دسترسی (ban/unban) — پلن‌تغییری به ستون عریض‌تر منتقل شد (DECISION-106) */}
          {can(ctx, "users.ban") && (
            <section className="rounded-2xl border border-black/8 bg-white/45 p-5">
              <UserActions
                userId={user.id}
                currentPlan={user.plan}
                currentCycle={user.planCycle}
                planExpiresAt={user.planExpiresAt?.toISOString() ?? null}
                isBanned={user.isBanned}
                canPlan={false}
                canBan={true}
              />
            </section>
          )}

          {/* شارژ/اصلاحِ دستیِ کیف‌پول — فقط با دسترسیِ مالی (DECISION-089) */}
          {can(ctx, "payment.manage") && (
            <section className="rounded-2xl border border-black/8 bg-white/45 p-5">
              <AdminWalletCharge userId={user.id} balance={user.walletBalance} />
            </section>
          )}

          {/* اقدامات ایمیل */}
          {user.email && (
            <section className="rounded-2xl border border-black/8 bg-white/45 p-5">
              <EmailActions
                userId={user.id}
                email={user.email}
                emailVerifiedAt={user.emailVerifiedAt?.toISOString() ?? null}
                hasPassword={Boolean(user.passwordHash)}
                canWrite={can(ctx, "users.write")}
              />
            </section>
          )}
        </div>

        {/* ─ ستون چپ — تیکت‌ها + چت آنلاین (عریض‌تر) ─ */}
        <div className="col-span-12 lg:col-span-7 space-y-4">

          {/* آخرین تیکت‌ها — اگر پلن اجازهٔ تیکت ندهد، مثل کارتِ چت غیرفعال نمایش داده می‌شود */}
          <section className={`rounded-2xl border overflow-hidden ${ticketingAllowed ? "border-black/8 bg-white/45" : "border-black/6 bg-white/25"}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/6">
              <div className="flex items-center gap-2">
                <TicketIcon muted={!ticketingAllowed} />
                <h2 className={`text-sm font-semibold ${ticketingAllowed ? "text-ink" : "text-fog"}`}>
                  آخرین تیکت‌ها
                </h2>
                {!ticketingAllowed && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/6 text-fog border border-black/8">
                    در این پلن نیست
                  </span>
                )}
                {ticketingAllowed && recentTickets.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/7 text-stone font-medium tabular-nums">
                    {toFa(recentTickets.length)}
                  </span>
                )}
              </div>
              {ticketingAllowed && (
                <Link
                  href="/admin/support"
                  className="text-[11px] text-stone hover:text-ink transition-colors flex items-center gap-1 group"
                >
                  مشاهده همه
                  <ArrowIcon />
                </Link>
              )}
            </div>

            {!ticketingAllowed ? (
              <EmptyState
                icon={<TicketIcon muted />}
                text={`کاربر پلن ${PLAN_LABELS[user.plan] ?? user.plan} دارد`}
                sub="تیکت پشتیبانی در پلن این کاربر فعال نیست"
                faded
              />
            ) : recentTickets.length === 0 ? (
              <EmptyState icon={<TicketIcon muted />} text="تیکتی ثبت نشده" />
            ) : (
              <div className="divide-y divide-black/5">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/support/${ticket.id}`}
                    className="group flex items-start gap-3 px-5 py-4 hover:bg-black/[0.025] transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={ticket.status} />
                        <span className="text-sm text-ink font-medium truncate leading-tight">
                          {ticket.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CategoryLabel category={ticket.category} />
                        <span className="text-fog/35 text-[10px]">·</span>
                        <span className="text-[11px] text-fog">{faDateTime(ticket.lastMessageAt)}</span>
                      </div>
                    </div>
                    <ChevronIcon />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* تغییر پلن + تنظیمِ روزهای انقضا — در ستونِ عریض‌تر (فضای بیشتر برای کنترل‌ها) */}
          {can(ctx, "users.plan.write") && (
            <section className="rounded-2xl border border-black/8 bg-white/45 p-5">
              <UserActions
                userId={user.id}
                currentPlan={user.plan}
                currentCycle={user.planCycle}
                planExpiresAt={user.planExpiresAt?.toISOString() ?? null}
                isBanned={user.isBanned}
                canPlan={true}
                canBan={false}
              />
            </section>
          )}

          {/* چت آنلاین — دسترسی از planAllows (هم‌ترازی با سایت)، نه چکِ hardcode پلن */}
          <section className={`rounded-2xl border overflow-hidden ${liveChatAllowed ? "border-black/8 bg-white/45" : "border-black/6 bg-white/25"}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/6">
              <div className="flex items-center gap-2">
                <ChatIcon muted={!liveChatAllowed} />
                <h2 className={`text-sm font-semibold ${liveChatAllowed ? "text-ink" : "text-fog"}`}>
                  چت آنلاین
                </h2>
                {!liveChatAllowed && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/6 text-fog border border-black/8">
                    در این پلن نیست
                  </span>
                )}
                {liveChatAllowed && recentChats.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/7 text-stone font-medium tabular-nums">
                    {toFa(recentChats.length)}
                  </span>
                )}
              </div>
              {liveChatAllowed && (
                <Link
                  href="/admin/livechat"
                  className="text-[11px] text-stone hover:text-ink transition-colors flex items-center gap-1"
                >
                  کنسول چت
                  <ArrowIcon />
                </Link>
              )}
            </div>

            {!liveChatAllowed ? (
              <EmptyState
                icon={<ChatIcon muted />}
                text={`کاربر پلن ${PLAN_LABELS[user.plan] ?? user.plan} دارد`}
                sub="چت آنلاین در پلن این کاربر فعال نیست"
                faded
              />
            ) : recentChats.length === 0 ? (
              <EmptyState icon={<ChatIcon />} text="سشن چتی ثبت نشده" />
            ) : (
              <div className="divide-y divide-black/5">
                {recentChats.map((session) => {
                  const sc = CHAT_STATUS[session.status] ?? { label: session.status, cls: "bg-black/7 text-stone" };
                  return (
                    <Link
                      key={session.id}
                      href="/admin/livechat"
                      className="group flex items-center gap-3 px-5 py-4 hover:bg-black/[0.025] transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>
                            {sc.label}
                          </span>
                          <span className="text-sm text-ink">{faDateFromKey(session.dayKey)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-fog">
                          <span>{toFa(session._count.messages)} پیام</span>
                          {session.lastUserAt && (
                            <>
                              <span className="text-fog/35">·</span>
                              <span>آخرین پیام: {faDateTime(session.lastUserAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronIcon />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <p className="text-[11px] text-fog/60 leading-relaxed">
        به‌دلیل حریم خصوصی، محتوای تعهدها، بازخوردها و پیام‌های کاربر برای ادمین نمایش داده نمی‌شود — تنها شمارش کلی.
      </p>
    </div>
  );
}

// ── زیرکامپوننت‌ها ────────────────────────────────────────────────────────────
function Meta({ label, value, muted, ltr }: { label: string; value: string; muted?: boolean; ltr?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-fog mb-0.5">{label}</div>
      <div
        className={`text-sm ${muted ? "text-fog/60" : "text-ink"} ${ltr ? "num-latin" : ""}`}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({ icon, text, sub, faded }: { icon: React.ReactNode; text: string; sub?: string; faded?: boolean }) {
  return (
    <div className={`px-5 py-8 flex flex-col items-center gap-2 ${faded ? "opacity-60" : ""}`}>
      <div className="opacity-30">{icon}</div>
      <p className="text-xs text-fog text-center">{text}</p>
      {sub && <p className="text-[11px] text-fog/60 text-center">{sub}</p>}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden
      className="shrink-0 text-fog/25 group-hover:text-fog/55 transition-colors mt-0.5"
    >
      <path d="M9 4L6 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden
      className="opacity-40 group-hover:opacity-70 transition-opacity"
    >
      <path d="M8 3H3M8 3v5M8 3L3 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TicketIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden
      className={muted ? "text-fog/40" : "text-fog"}
    >
      <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 5.5h6M4 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden
      className={muted ? "text-fog/40" : "text-fog"}
    >
      <path
        d="M12.5 2H1.5A.5.5 0 001 2.5v7a.5.5 0 00.5.5H3l2 2 2-2h5.5a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5z"
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
      />
    </svg>
  );
}
