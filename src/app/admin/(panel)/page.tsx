// ─────────────────────────────────────────────────────────────────────────────
// /admin — داشبورد پنل (آمار پایه). enforce: dashboard.view
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";

export const dynamic = "force-dynamic";

function toFa(n: number): string {
  return n.toLocaleString("fa-IR");
}

export default async function AdminDashboardPage() {
  const ctx = await requirePermission("dashboard.view");

  const now = getNow();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, bannedUsers, planGroups, entriesWeek, reportsWeek, totalAdmins] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.groupBy({ by: ["plan"], _count: { plan: true } }),
      prisma.dailyEntry.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.weeklyReport.count({ where: { generatedAt: { gte: weekAgo } } }),
      prisma.adminUser.count(),
    ]);

  const planMap: Record<string, number> = {};
  for (const g of planGroups) planMap[g.plan] = g._count.plan;
  const plans = [
    { code: "FREE", label: "رایگان", count: planMap.FREE ?? 0 },
    { code: "PLUS", label: "پلاس", count: planMap.PLUS ?? 0 },
    { code: "PRO", label: "پرو", count: planMap.PRO ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-ink">داشبورد</h1>
        <p className="text-sm text-stone mt-1">
          خوش آمدی، {ctx.admin.displayName}.
        </p>
      </header>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="کل کاربران" value={totalUsers} />
        <StatCard label="تعهد (۷ روز اخیر)" value={entriesWeek} />
        <StatCard label="گزارش (۷ روز اخیر)" value={reportsWeek} />
        <StatCard label="کاربران مسدود" value={bannedUsers} tone={bannedUsers > 0 ? "warn" : "default"} />
      </div>

      {/* توزیع پلن */}
      <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
        <h2 className="text-sm font-semibold text-ink mb-4">توزیع پلن‌ها</h2>
        <div className="space-y-3">
          {plans.map((p) => {
            const pct = totalUsers > 0 ? Math.round((p.count / totalUsers) * 100) : 0;
            return (
              <div key={p.code}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-stone">{p.label}</span>
                  <span className="text-[11px] text-fog fa-num">
                    {toFa(p.count)} ({toFa(pct)}٪)
                  </span>
                </div>
                <div className="h-1.5 bg-black/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ember/55 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-fog">
        تعداد ادمین‌های فعال سیستم: <span className="fa-num">{toFa(totalAdmins)}</span>
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warn";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "warn" ? "border-ember/25 bg-ember/5" : "border-black/8 bg-white/40"
      }`}
    >
      <div className="text-2xl font-bold text-ink fa-num">{toFa(value)}</div>
      <div className="text-[11px] text-fog mt-1">{label}</div>
    </div>
  );
}
