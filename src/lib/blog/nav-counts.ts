// ─────────────────────────────────────────────────────────────────────────────
// nav-counts.ts — شمارِ badgeِ بلاگ برای سایدبارِ پنل (DECISION-065)
// «اعلان پنل» کامنت‌های جدید = شمارِ کامنت‌های در انتظارِ تأیید.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";

export async function getPendingCommentsCount(): Promise<number> {
  return prisma.blogComment.count({ where: { status: "pending" } });
}
