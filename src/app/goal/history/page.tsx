// ─────────────────────────────────────────────────────────────────────────────
// /goal/history — تاریخچهٔ اهدافِ تمام‌شده/رهاشده (DECISION-082) — فقط‌خواندنی.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { formatJalali } from "@/lib/utils/date";
import { totalDays } from "@/lib/goal/dates";

export const metadata = { title: "تاریخچهٔ اهداف — همسو" };

const STATUS_LABEL: Record<string, string> = {
  completed: "به پایان رسید",
  abandoned: "رهاشده",
};

export default async function GoalHistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const goals = await prisma.goal.findMany({
    where: { userId: user.userId, status: { in: ["completed", "abandoned"] } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { stories: true } } },
  });

  return (
    <AppShell>
      <div className="flex-1 px-5 pt-10 pb-28 sm:pt-14">
        <div className="mx-auto w-full max-w-2xl animate-fade-up">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-ink">تاریخچهٔ اهداف</h1>
            <Link href="/goal" className="text-[13px] text-stone hover:text-ink">
              بازگشت به برنامه‌ریزی
            </Link>
          </div>

          {goals.length === 0 ? (
            <p className="rounded-2xl border border-bone bg-white/40 px-4 py-10 text-center text-[13px] text-fog">
              هنوز هدفِ تمام‌شده‌ای نداری.
            </p>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => (
                <div key={g.id} className="glass-strong rounded-2xl p-4 shadow-paper">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 truncate text-sm font-semibold text-ink">{g.title}</h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] ${
                        g.status === "completed" ? "bg-sage/12 text-sage-deep" : "bg-black/5 text-stone"
                      }`}
                    >
                      {STATUS_LABEL[g.status] ?? g.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-stone fa-num">
                    {formatJalali(g.startDate)} ← {formatJalali(g.endDate)}
                    {" · "}
                    {totalDays(g.startDate, g.endDate).toLocaleString("fa-IR")} روز
                  </p>
                  <p className="mt-1 text-[11px] text-fog fa-num">
                    {g._count.stories.toLocaleString("fa-IR")} استوری
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
