// ─────────────────────────────────────────────────────────────────────────────
// /admin/broadcast — ارسال اطلاعیه همگانی (DECISION-109)
// enforce: notification.broadcast (مالک + ادمین سیستم — DECISION-110)
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission } from "@/lib/admin/auth-server";
import { BroadcastPanel } from "@/components/admin/broadcast/BroadcastPanel";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  await requirePermission("notification.broadcast");

  const [total, byPlan] = await Promise.all([
    prisma.user.count({ where: { isBanned: false } }),
    prisma.user.groupBy({ by: ["plan"], where: { isBanned: false }, _count: { _all: true } }),
  ]);

  const counts: Record<string, number> = { all: total };
  for (const r of byPlan) counts[r.plan] = r._count._all;

  return (
    <div className="space-y-6 pb-10">
      {/* سرصفحه */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink">ارسال اطلاعیه</h1>
          <p className="text-xs text-fog mt-0.5">
            پیام مستقیم به همهٔ کاربران یا یک بخش از کاربران ارسال می‌شود.
          </p>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
        {[
          { key: "all", label: "همه" },
          { key: "FREE", label: "رایگان" },
          { key: "PLUS", label: "پلاس" },
          { key: "PRO", label: "پرو" },
        ].map((s) => (
          <div key={s.key} className="rounded-2xl border border-black/8 bg-white/45 p-4 text-center">
            <p className="text-2xl font-semibold text-ink fa-num">
              {(counts[s.key] ?? 0).toLocaleString("fa-IR")}
            </p>
            <p className="text-[11px] text-fog mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* فرم */}
      <BroadcastPanel />
    </div>
  );
}
