// ─────────────────────────────────────────────────────────────────────────────
// /goal — فیچر «برنامه‌ریزی» (DECISION-082)
// Server Component: session را می‌خواند، نمای هدفِ فعال را از goal/server می‌گیرد و
// یا فرمِ ساختِ هدف یا استوری‌بورد را رندر می‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { loadActiveGoalView } from "@/lib/goal/server";
import { todayKey } from "@/lib/goal/dates";
import { GoalCreateForm } from "@/components/features/goal/GoalCreateForm";
import { GoalStoryboard } from "@/components/features/goal/GoalStoryboard";

export const metadata = { title: "برنامه‌ریزی — همسو" };

export default async function GoalPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const view = await loadActiveGoalView(user.userId);
  const todayIso = todayKey();

  return (
    <AppShell>
      <div className="flex-1 px-5 pt-10 pb-28 sm:pt-14">
        <div className="mx-auto w-full max-w-3xl">
          {view.goal ? (
            <GoalStoryboard view={view} todayIso={todayIso} />
          ) : (
            <GoalCreateForm planningAllowed={view.planningAllowed} todayIso={todayIso} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
