// ─────────────────────────────────────────────────────────────────────────────
// support/presence.ts — حضورِ زندهٔ پشتیبان‌ها (DECISION-049)
//
// پشتیبان «آنلاین» = ادمینِ فعالِ دارای مجوز support.respond که heartbeat تازه دارد
// (lastSeenAt جدیدتر از PRESENCE_WINDOW_MS). heartbeat هنگام باز بودن کنسول چت زده می‌شود.
//
// همهٔ خطاها بلعیده می‌شوند — presence هرگز نباید جریان اصلی را بشکند.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { PRESENCE_WINDOW_MS } from "@/lib/support/chat";

const SUPPORT_RESPOND_PERMISSION = "support.respond";

/** ثبت ضربان حضور یک پشتیبان (هنگام باز بودن کنسول). خطا → بی‌صدا. */
export async function touchAdminPresence(adminId: string): Promise<void> {
  try {
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { lastSeenAt: getNow() },
    });
  } catch {
    // غیربحرانی — نادیده
  }
}

/** آیا حداقل یک پشتیبانِ دارای مجوز پاسخ، همین حالا فعال است؟ (مستقل از ساعت کاری) */
export async function isAnySupportAdminActive(now: Date): Promise<boolean> {
  const threshold = new Date(now.getTime() - PRESENCE_WINDOW_MS);
  try {
    const count = await prisma.adminUser.count({
      where: {
        isActive: true,
        lastSeenAt: { gt: threshold },
        role: {
          permissions: {
            some: { permission: { key: SUPPORT_RESPOND_PERMISSION } },
          },
        },
      },
    });
    return count > 0;
  } catch {
    return false;
  }
}
