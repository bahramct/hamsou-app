// ─────────────────────────────────────────────────────────────────────────────
// /admin/support/[id] — جزئیات تیکت + پاسخ + کنترل وضعیت/اولویت (DECISION-044)
// enforce: support.read (مشاهده). پاسخ/تغییر وضعیت فقط با support.respond.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { TicketThread, type ThreadMessage } from "@/components/features/support/TicketThread";
import { StatusBadge, PriorityBadge } from "@/components/features/support/badges";
import { AdminReplyForm } from "@/components/admin/support/AdminReplyForm";
import { TicketControls } from "@/components/admin/support/TicketControls";
import { Categories } from "@/lib/support/tickets";
import { toFaDigits } from "@/lib/utils/digits";

export const dynamic = "force-dynamic";

function faDateTime(d: Date): string {
  return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" });
}

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("support.read");
  const canRespond = can(ctx, "support.respond");

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, displayName: true, phone: true, email: true, plan: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { authorAdmin: { select: { displayName: true } } },
      },
    },
  });
  if (!ticket) notFound();

  const messages: ThreadMessage[] = ticket.messages.map((m) => ({
    id: m.id,
    authorType: m.authorType,
    authorLabel:
      m.authorType === "admin"
        ? (m.authorAdmin?.displayName ?? "پشتیبانی")
        : (ticket.user.displayName || "کاربر"),
    body: m.body,
    createdAt: m.createdAt,
  }));

  return (
    <div className="space-y-5">
      <Link href="/admin/support" className="text-xs text-stone hover:text-ink">→ بازگشت به تیکت‌ها</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ستون اصلی: گفتگو */}
        <div className="lg:col-span-2 space-y-4">
          <header className="rounded-2xl border border-black/8 bg-white/50 p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-base font-semibold text-ink">{ticket.subject}</h1>
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
            <span className="text-[11px] text-fog">{Categories.label(ticket.category)}</span>
          </header>

          <TicketThread messages={messages} mySide="admin" />

          {canRespond ? (
            <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
              <AdminReplyForm ticketId={ticket.id} />
            </div>
          ) : (
            <p className="text-xs text-fog italic text-center py-2">برای پاسخ‌دادن به دسترسی «پاسخ به تیکت‌ها» نیاز است.</p>
          )}
        </div>

        {/* ستون کناری: اطلاعات کاربر + کنترل‌ها */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-black/8 bg-white/50 p-4 space-y-2">
            <h2 className="text-xs font-semibold text-ink">کاربر</h2>
            <div className="text-sm text-stone">{ticket.user.displayName || "—"}</div>
            <div className="text-xs text-fog num-latin" dir="ltr">
              {ticket.user.phone ? toFaDigits(ticket.user.phone) : ticket.user.email ?? "—"}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-fog">پلن: {ticket.user.plan}</span>
              <Link href={`/admin/users/${ticket.user.id}`} className="text-[11px] text-ember hover:underline">پروفایل کاربر</Link>
            </div>
            <div className="text-[10px] text-fog fa-num pt-1 border-t border-black/6 mt-1">
              ساخت: {faDateTime(ticket.createdAt)}
            </div>
          </div>

          <div className="rounded-2xl border border-black/8 bg-white/50 p-4">
            <h2 className="text-xs font-semibold text-ink mb-2">مدیریت تیکت</h2>
            <TicketControls
              ticketId={ticket.id}
              status={ticket.status}
              priority={ticket.priority}
              canRespond={canRespond}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
