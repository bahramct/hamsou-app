// ─────────────────────────────────────────────────────────────────────────────
// /support — تیکت‌های پشتیبانی کاربر (DECISION-044)
// گیت دسترسی: planAllows("support.ticketing"). پلن بدون دسترسی → CTA ارتقا (نه لیست).
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { getTicketingContext } from "@/lib/support/server";
import { NewTicketForm } from "@/components/features/support/NewTicketForm";
import { StatusBadge, CategoryLabel } from "@/components/features/support/badges";
import { MarkNotificationsRead } from "@/components/notifications/MarkNotificationsRead";

export const dynamic = "force-dynamic";

function faDateTime(d: Date): string {
  return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" });
}

export default async function SupportPage() {
  const ctx = await getTicketingContext();
  if (!ctx) redirect("/login");

  return (
    <AppShell>
      {/* به‌محض ورود به بخش تیکت‌ها badge اعلان‌های support.* پاک می‌شود */}
      <MarkNotificationsRead typePrefix="support" />
      <div className="flex-1 max-w-3xl mx-auto w-full px-5 py-8 sm:py-12 space-y-6 animate-fade-up">
        <header>
          <h1 className="text-xl font-semibold text-ink">پشتیبانی</h1>
          <p className="text-sm text-stone mt-1 leading-relaxed">
            سؤال یا مشکلی داری؟ تیکت بفرست؛ پاسخ را همین‌جا می‌بینی.
          </p>
        </header>

        {!ctx.allowed ? (
          <UpgradeCta />
        ) : (
          <TicketsArea userId={ctx.userId} />
        )}
      </div>
    </AppShell>
  );
}

async function TicketsArea({ userId }: { userId: string }) {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { lastMessageAt: "desc" },
    select: { id: true, subject: true, category: true, status: true, lastMessageAt: true },
  });

  return (
    <div className="space-y-6">
      <NewTicketForm />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">تیکت‌های من</h2>
        {tickets.length === 0 ? (
          <p className="text-sm text-fog italic py-8 text-center">هنوز تیکتی ثبت نکرده‌ای.</p>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/support/${t.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/8 bg-white/50 px-4 py-3 hover:bg-white/80 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-ink truncate">{t.subject}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryLabel category={t.category} />
                      <span className="text-[10px] text-fog fa-num">{faDateTime(t.lastMessageAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function UpgradeCta() {
  return (
    <div className="rounded-2xl border border-gold/25 bg-gold/5 p-6 text-center space-y-3">
      <p className="text-sm text-charcoal leading-relaxed">
        ارتباط تیکتینگ با پشتیبانی بخشی از پلن <b>پرو</b> است.
        برای دسترسی، پلن خود را ارتقا بده.
      </p>
      <Link
        href="/plans"
        className="inline-block px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
      >
        مشاهدهٔ پلن‌ها
      </Link>
    </div>
  );
}
