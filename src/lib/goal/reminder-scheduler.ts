// ─────────────────────────────────────────────────────────────────────────────
// goal/reminder-scheduler.ts — زمان‌بندِ یادآوریِ هدف (DECISION-082)
//
// runReminderTick(): همهٔ GoalReminder فعال (روی goalهای active) را می‌خواند، اسلاتِ
// زمانیِ فعلیِ ایران را می‌سنجد و برای هر «ساعت»ی که در این تیک رسیده و در همان اسلات
// قبلاً نفرستاده‌ایم، یک اعلانِ درون‌برنامه‌ای (createNotification) + در صورت لزوم ایمیل می‌فرستد.
// lastFiredKey="YYYY-MM-DD#HH:mm" ضدِ ارسالِ تکراری است.
//
// زمان از getNow()/iranClock() می‌آید → time-travel در dev کار می‌کند (DECISION-021).
// لحنِ آرام و بدون فشار (DECISION-023). فقط goalهای active یادآوری می‌گیرند.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/notifications/server";
import { sendGoalReminderEmail } from "@/lib/email/send";
import { iranClock, todayKey } from "@/lib/goal/dates";

export interface ReminderTickResult {
  checked: number;
  fired: number;
  emailsSent: number;
  nowClock: string;
  dayKey: string;
}

/** "HH:mm" → دقیقهٔ روز. نامعتبر → null. */
function toMinutes(hhmm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * یک تیکِ زمان‌بند. windowMinutes = پنجرهٔ تحمل (پیش‌فرض ۲۰ دقیقه) تا اگر cron دقیقاً
 * سرِ ساعت اجرا نشد، یادآوریِ نزدیک هم پوشش داده شود (ضدِ تکرار با lastFiredKey).
 */
export async function runReminderTick(windowMinutes = 20): Promise<ReminderTickResult> {
  const nowClock = iranClock();
  const dayKey = todayKey();
  const nowMin = toMinutes(nowClock) ?? 0;

  const reminders = await prisma.goalReminder.findMany({
    where: { enabled: true, goal: { status: "active" } },
    include: { goal: { select: { id: true, title: true, userId: true } } },
  });

  let fired = 0;
  let emailsSent = 0;

  for (const r of reminders) {
    const times = r.times ? r.times.split(",").filter(Boolean) : [];
    // نزدیک‌ترین ساعتِ «رسیده» در پنجرهٔ تحمل که هنوز امروز در آن اسلات نفرستاده‌ایم
    let dueTime: string | null = null;
    for (const t of times) {
      const tm = toMinutes(t);
      if (tm === null) continue;
      const delta = nowMin - tm;
      if (delta >= 0 && delta <= windowMinutes) {
        const firedKey = `${dayKey}#${t}`;
        if (r.lastFiredKey === firedKey) continue; // قبلاً همین اسلات فرستاده شده
        dueTime = t;
        break;
      }
    }
    if (!dueTime) continue;

    const firedKey = `${dayKey}#${dueTime}`;

    // اعلانِ درون‌برنامه‌ای (همیشه)
    await createNotification({
      userId: r.goal.userId,
      type: "goal.reminder",
      data: { goalTitle: r.goal.title, customMessage: r.customMessage ?? undefined },
    });

    // ایمیل (در صورت انتخابِ کانال) — best-effort
    if (r.channel === "email" || r.channel === "both") {
      try {
        const u = await prisma.user.findUnique({
          where: { id: r.goal.userId },
          select: { email: true },
        });
        if (u?.email) {
          const subject = "یادآوریِ مسیرت — همسو";
          const body =
            (r.customMessage?.trim() || "یک لحظه به مسیرت سر بزن.") +
            `\n\nهدف: «${r.goal.title}»`;
          const res = await sendGoalReminderEmail(u.email, subject, body);
          if (res.success) emailsSent++;
        }
      } catch (e) {
        console.error("[goal-reminder] ارسال ایمیل ناموفق:", e);
      }
    }

    await prisma.goalReminder.update({
      where: { id: r.id },
      data: { lastFiredKey: firedKey },
    });
    fired++;
  }

  return { checked: reminders.length, fired, emailsSent, nowClock, dayKey };
}
