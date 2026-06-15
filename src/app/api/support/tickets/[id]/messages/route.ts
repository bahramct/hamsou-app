// ─────────────────────────────────────────────────────────────────────────────
// POST /api/support/tickets/[id]/messages — پاسخ کاربر در یک تیکت (DECISION-044)
// گیت: لاگین + planAllows + مالکیت تیکت. پاسخ کاربر → وضعیت «باز» (نیازمند پشتیبانی).
// تیکتِ بسته‌شده توسط پشتیبان دیگر قابل پاسخ نیست (کاربر نمی‌تواند بازگشایی کند).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { getTicketingContext } from "@/lib/support/server";
import { TICKET_LIMITS } from "@/lib/support/tickets";

// GET — تیکت + رشتهٔ پیام‌ها (برای نمای گفتگوی دراور، DECISION-096)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getTicketingContext();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: {
      id: true, userId: true, subject: true, status: true, category: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, authorType: true, body: true, createdAt: true },
      },
    },
  });
  if (!ticket || ticket.userId !== ctx.userId) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      category: ticket.category,
      messages: ticket.messages.map((m) => ({
        id: m.id,
        authorType: m.authorType,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getTicketingContext();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!ctx.allowed) {
    return NextResponse.json({ error: "این قابلیت در پلن فعلی شما فعال نیست." }, { status: 403 });
  }

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (!ticket || ticket.userId !== ctx.userId) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }

  // تیکتِ بسته‌شده توسط پشتیبان دیگر قابل پاسخ نیست (نه بازگشایی).
  if (ticket.status === "closed") {
    return NextResponse.json(
      { error: "این تیکت بسته شده و دیگر امکان پاسخ ندارد. برای موضوع جدید، تیکت تازه‌ای باز کن." },
      { status: 409 }
    );
  }

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const message = b && typeof b.message === "string" ? b.message.trim() : "";
  if (message.length < TICKET_LIMITS.messageMin || message.length > TICKET_LIMITS.messageMax) {
    return NextResponse.json({ error: "متن پیام نامعتبر است." }, { status: 400 });
  }

  const now = getNow();
  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorType: "user",
        authorUserId: ctx.userId,
        body: message,
        createdAt: now,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticket.id },
      // پاسخ کاربر روی تیکتِ بازِ موجود (answered/in_progress/open) → منتظر پشتیبانی.
      // تیکتِ closed بالاتر رد شده، پس این‌جا هرگز بازگشایی رخ نمی‌دهد.
      data: { status: "open", lastMessageAt: now },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
