// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/support/tickets/[id]/messages — پاسخ پشتیبان به تیکت (DECISION-044)
// enforce: support.respond. پاسخ پشتیبان → وضعیت «پاسخ داده شد». audit: support.reply.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { TICKET_LIMITS } from "@/lib/support/tickets";
import { createNotification } from "@/lib/notifications/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "support.respond")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { id: true, userId: true, subject: true },
  });
  if (!ticket) return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const message = b && typeof b.message === "string" ? b.message.trim() : "";
  if (message.length < TICKET_LIMITS.messageMin || message.length > TICKET_LIMITS.messageMax) {
    return NextResponse.json({ error: "متن پاسخ نامعتبر است." }, { status: 400 });
  }

  const now = getNow();
  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorType: "admin",
        authorAdminId: ctx.admin.id,
        body: message,
        createdAt: now,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "answered", lastMessageAt: now },
    }),
  ]);

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "support.reply",
    targetType: "ticket",
    targetId: ticket.id,
  });

  // اعلان به صاحب تیکت — پاسخ پشتیبانی (DECISION-046)
  await createNotification({
    userId: ticket.userId,
    type: "support.replied",
    data: { ticketId: ticket.id, subject: ticket.subject },
  });

  return NextResponse.json({ ok: true });
}
