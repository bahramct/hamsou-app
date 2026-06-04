// ─────────────────────────────────────────────────────────────────────────────
// /admin/users/[id] — جزئیات کاربر + تغییر پلن + مسدودسازی
// enforce: users.read (مشاهده). اکشن‌ها: users.plan.write / users.ban (در UserActions + API)
// حریم خصوصی (DECISION-026 §۷): محتوای تعهد/چت هرگز نمایش داده نمی‌شود — فقط شمارش.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { UserActions } from "@/components/admin/users/UserActions";
import { toFaDigits } from "@/lib/utils/digits";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = { FREE: "رایگان", PLUS: "پلاس", PRO: "پرو" };

function toFa(n: number): string {
  return n.toLocaleString("fa-IR");
}
function faDateTime(d: Date): string {
  return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" });
}

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
      id: true,
      phone: true,
      displayName: true,
      bio: true,
      plan: true,
      isBanned: true,
      createdAt: true,
      companionName: true,
      _count: {
        select: { entries: true, gaps: true, weeklyReports: true, chatMessages: true },
      },
    },
  });

  if (!user) notFound();

  const stats = [
    { label: "تعهدها", value: user._count.entries },
    { label: "فاصله‌ها", value: user._count.gaps },
    { label: "گزارش هفتگی", value: user._count.weeklyReports },
    { label: "پیام چت", value: user._count.chatMessages },
  ];

  return (
    <div className="space-y-7 max-w-3xl">
      <Link href="/admin/users" className="text-xs text-stone hover:text-ink transition-colors inline-flex items-center gap-1">
        → بازگشت به لیست
      </Link>

      {/* هدر */}
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-ember/15 text-ember flex items-center justify-center text-lg font-semibold shrink-0">
          {(user.displayName || user.phone).slice(-2)}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-ink flex items-center gap-2">
            {user.displayName || "بدون نام"}
            {user.isBanned && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-ember/12 text-ember">مسدود</span>
            )}
          </h1>
          <p className="text-sm text-fog" dir="ltr">{toFaDigits(user.phone)}</p>
        </div>
      </header>

      {/* متادیتا */}
      <section className="rounded-2xl border border-black/8 bg-white/40 p-5 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
        <Meta label="پلن فعلی" value={PLAN_LABELS[user.plan] ?? user.plan} />
        <Meta label="تاریخ عضویت" value={faDateTime(user.createdAt)} />
        <Meta label="نام همدم" value={user.companionName || "همدم"} />
        <Meta label="بیو" value={user.bio || "—"} />
      </section>

      {/* شمارش فعالیت (بدون محتوا — حریم خصوصی) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-black/8 bg-white/40 p-4 text-center">
            <div className="text-xl font-bold text-ink fa-num">{toFa(s.value)}</div>
            <div className="text-[11px] text-fog mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* اکشن‌ها */}
      <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
        <UserActions
          userId={user.id}
          currentPlan={user.plan}
          isBanned={user.isBanned}
          canPlan={can(ctx, "users.plan.write")}
          canBan={can(ctx, "users.ban")}
        />
      </section>

      <p className="text-[11px] text-fog/70 leading-relaxed">
        به‌دلیل حریم خصوصی، محتوای تعهدها، بازخوردها و پیام‌های کاربر برای ادمین نمایش داده نمی‌شود — تنها شمارش کلی.
      </p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-fog mb-0.5">{label}</div>
      <div className="text-ink">{value}</div>
    </div>
  );
}
