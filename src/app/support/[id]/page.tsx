// ─────────────────────────────────────────────────────────────────────────────
// /support/[id] — صفحهٔ یک تیکت کاربر: رشتهٔ پیام‌ها + پاسخ (DECISION-044)
// گیت: مالکیت تیکت + planAllows. تیکت دیگران/ناموجود → 404.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/client";
import { getTicketingContext } from "@/lib/support/server";
import { ReplyForm } from "@/components/features/support/ReplyForm";
import { TicketThread, type ThreadMessage } from "@/components/features/support/TicketThread";
import { StatusBadge, CategoryLabel } from "@/components/features/support/badges";

export const dynamic = "force-dynamic";

export default async function UserTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getTicketingContext();
  if (!ctx) redirect("/login");
  if (!ctx.allowed) redirect("/support");

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { authorAdmin: { select: { displayName: true } } },
      },
    },
  });
  if (!ticket || ticket.userId !== ctx.userId) notFound();

  const messages: ThreadMessage[] = ticket.messages.map((m) => ({
    id: m.id,
    authorType: m.authorType,
    authorLabel: m.authorType === "admin" ? "پشتیبانی همسو" : "شما",
    body: m.body,
    createdAt: m.createdAt,
  }));

  const isClosed = ticket.status === "closed";

  return (
    <AppShell>
      <div className="flex-1 max-w-3xl mx-auto w-full px-5 py-8 sm:py-12 space-y-5 animate-fade-up">
        <Link href="/support" className="text-xs text-stone hover:text-ink">→ بازگشت به پشتیبانی</Link>

        <header className="rounded-2xl border border-black/8 bg-white/50 p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-base font-semibold text-ink">{ticket.subject}</h1>
            <StatusBadge status={ticket.status} />
          </div>
          <CategoryLabel category={ticket.category} />
        </header>

        <TicketThread messages={messages} mySide="user" />

        {isClosed ? (
          <div className="rounded-xl bg-black/4 border border-black/8 px-4 py-4 text-center space-y-2">
            <p className="text-xs text-stone">این تیکت توسط پشتیبانی بسته شده و دیگر امکان پاسخ ندارد.</p>
            <Link
              href="/support"
              className="inline-flex items-center justify-center text-xs text-ember hover:underline transition-colors"
            >
              برای موضوع جدید، تیکت تازه باز کن
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
            <ReplyForm ticketId={ticket.id} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
