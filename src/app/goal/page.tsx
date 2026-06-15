// ─────────────────────────────────────────────────────────────────────────────
// /goal — فیچر «برنامه‌ریزی» (DECISION-082)
// Server Component: session را می‌خواند، نمای هدفِ فعال را از goal/server می‌گیرد و
// یا فرمِ ساختِ هدف یا استوری‌بورد را رندر می‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { loadActiveGoalView, loadJourneyCards } from "@/lib/goal/server";
import { todayKey } from "@/lib/goal/dates";
import { GoalCreateForm } from "@/components/features/goal/GoalCreateForm";
import { GoalStoryboard } from "@/components/features/goal/GoalStoryboard";
import { JourneyLibrary } from "@/components/features/goal/JourneyLibrary";

export const metadata = { title: "برنامه‌ریزی و چالش — همسو" };

export default async function GoalPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [view, journeyCards] = await Promise.all([
    loadActiveGoalView(user.userId),
    loadJourneyCards(user.userId),
  ]);
  const todayIso = todayKey();

  return (
    <AppShell>
      <div className="jp-wrap animate-fade-up">
        {view.goal ? (
          <GoalStoryboard view={view} todayIso={todayIso} />
        ) : (
          <GoalCreateForm planningAllowed={view.planningAllowed} todayIso={todayIso} />
        )}

        {/* مسیرهای گذشته — کتابخانه (الگوی ماکاپ) */}
        {journeyCards.length > 0 && (
          <>
            <div className="dsh-sec">
              <h2>مسیرهای گذشته</h2>
              <span className="rule" />
              <span className="hint">هر مسیر، یک فصل از راهی که رفته‌ای</span>
            </div>
            <JourneyLibrary cards={journeyCards} />
          </>
        )}
      </div>
    </AppShell>
  );
}
