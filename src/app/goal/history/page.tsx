// ─────────────────────────────────────────────────────────────────────────────
// /goal/history — «کتابخانهٔ مسیرها» (TASK-28 فاز ۳؛ بازنویسیِ تاریخچهٔ اهداف)
// نمای مستقلِ همهٔ مسیرهای گذشته (completed|abandoned) با کارت‌های پرروح + بازخوانیِ سفر.
// همان کتابخانه در پایینِ /goal هم نشان داده می‌شود (الگوی ماکاپ).
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/utils/auth-server";
import { AppShell } from "@/components/layout/AppShell";
import { loadJourneyCards } from "@/lib/goal/server";
import { JourneyLibrary } from "@/components/features/goal/JourneyLibrary";

export const metadata = { title: "کتابخانهٔ مسیرها — همسو" };

export default async function GoalHistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const cards = await loadJourneyCards(user.userId);

  return (
    <AppShell>
      <div className="jp-wrap animate-fade-up">
        <div className="mb-7 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-ink">کتابخانهٔ مسیرها</h1>
            <p className="mt-1 text-[12.5px] text-stone">هر مسیر، یک فصل از راهی که رفته‌ای.</p>
          </div>
          <Link href="/goal" className="shrink-0 text-[13px] text-stone hover:text-ink">
            بازگشت به برنامه‌ریزی و چالش
          </Link>
        </div>

        <JourneyLibrary cards={cards} emptyMessage="هنوز مسیرِ تمام‌شده‌ای نداری." />
      </div>
    </AppShell>
  );
}
