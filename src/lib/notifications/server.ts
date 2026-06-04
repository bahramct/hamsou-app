// ─────────────────────────────────────────────────────────────────────────────
// Notification server helper — تنها درگاهِ ساخت/خواندن اعلان‌ها (DECISION-046)
//
// قاعدهٔ طلایی: هیچ کدی مستقیماً prisma.notification را برای ساخت صدا نمی‌زند —
// همیشه createNotification(...) (مثل invokeAI برای AI). این نقطهٔ واحد بعداً
// اجازه می‌دهد ارسال بیرونی (push/sms) به‌سادگی روی channel سوار شود.
//
// زمان: getNow() (CLAUDE.md §۱۳) تا time-travel در dev کار کند.
// حریم خصوصی/داده: اعلان‌ها هرگز حذف نمی‌شوند (data-philosophy) — فقط خوانده می‌شوند.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";

export interface CreateNotificationInput {
  userId: string;
  type: string; // کلید کاتالوگ (catalog.ts)
  data?: Record<string, unknown>;
  linkUrl?: string;
  channel?: string; // پیش‌فرض "inapp"
}

/** ساخت یک اعلان ماندگار برای کاربر. خطا را بالا نمی‌اندازد تا producer نشکند. */
export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        data: input.data ? JSON.stringify(input.data) : null,
        linkUrl: input.linkUrl ?? null,
        channel: input.channel ?? "inapp",
        createdAt: getNow(),
      },
    });
  } catch (err) {
    // اعلان یک side-effect است؛ شکستش نباید جریان اصلی (پاسخ تیکت و…) را خراب کند
    console.error("[notifications] createNotification ناموفق:", err);
    return null;
  }
}

export async function listNotifications(
  userId: string,
  opts?: { limit?: number; before?: Date }
) {
  const limit = Math.min(Math.max(opts?.limit ?? 30, 1), 100);
  return prisma.notification.findMany({
    where: {
      userId,
      ...(opts?.before ? { createdAt: { lt: opts.before } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/** علامت خوانده‌شده — userId در where تضمین مالکیت است. */
export async function markRead(userId: string, id: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: getNow() },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: getNow() },
  });
}
