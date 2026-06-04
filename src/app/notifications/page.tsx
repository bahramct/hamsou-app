// ─────────────────────────────────────────────────────────────────────────────
// /notifications — صفحهٔ کامل یادآوری‌ها (DECISION-046)
// Server Component — مستقیماً DB می‌خواند. لینک‌دهی از ناقوس + کارت پروفایل.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSessionUser } from "@/lib/utils/auth-server";
import { listNotifications } from "@/lib/notifications/server";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import type { SerializedNotification } from "@/types/notification";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const rows = await listNotifications(user.userId, { limit: 50 });
  const items: SerializedNotification[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    data: n.data,
    linkUrl: n.linkUrl,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <AppShell>
      <div className="flex-1 max-w-xl mx-auto w-full px-5 py-8 sm:py-12 space-y-5 animate-fade-up">
        <header>
          <h1 className="text-lg font-semibold text-ink">یادآوری‌ها</h1>
          <p className="text-xs text-fog mt-1">رویدادهای مهم مسیر تو</p>
        </header>
        <NotificationsList initial={items} />
      </div>
    </AppShell>
  );
}
