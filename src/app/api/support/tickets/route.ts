// ─────────────────────────────────────────────────────────────────────────────
// POST /api/support/tickets — ساخت تیکت جدید توسط کاربر (DECISION-044)
// گیت: لاگین + planAllows("support.ticketing"). تیکت + اولین پیام در یک تراکنش.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { getTicketingContext } from "@/lib/support/server";
import {
  Categories,
  Priorities,
  DEFAULT_CATEGORY,
  DEFAULT_CHANNEL,
  DEFAULT_PRIORITY,
  TICKET_LIMITS,
} from "@/lib/support/tickets";

// GET — فهرستِ تیکت‌های کاربر (برای دراورِ پشتیبانی در پروفایل، DECISION-096)
export async function GET() {
  const ctx = await getTicketingContext();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: ctx.userId },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: { id: true, subject: true, category: true, status: true, lastMessageAt: true },
  });

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      category: t.category,
      status: t.status,
      lastMessageAt: t.lastMessageAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getTicketingContext();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!ctx.allowed) {
    return NextResponse.json({ error: "این قابلیت در پلن فعلی شما فعال نیست." }, { status: 403 });
  }

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });

  const subject = typeof b.subject === "string" ? b.subject.trim() : "";
  const message = typeof b.message === "string" ? b.message.trim() : "";
  const category = typeof b.category === "string" && Categories.is(b.category) ? b.category : DEFAULT_CATEGORY;
  const priority = typeof b.priority === "string" && Priorities.is(b.priority) ? b.priority : DEFAULT_PRIORITY;

  if (subject.length < TICKET_LIMITS.subjectMin || subject.length > TICKET_LIMITS.subjectMax) {
    return NextResponse.json({ error: "موضوع باید بین ۳ تا ۱۲۰ نویسه باشد." }, { status: 400 });
  }
  if (message.length < TICKET_LIMITS.messageMin || message.length > TICKET_LIMITS.messageMax) {
    return NextResponse.json({ error: "متن پیام نامعتبر است." }, { status: 400 });
  }

  const now = getNow();
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: ctx.userId,
      subject,
      category,
      priority,
      status: "open",
      channel: DEFAULT_CHANNEL,
      lastMessageAt: now,
      createdAt: now,
      messages: {
        create: {
          authorType: "user",
          authorUserId: ctx.userId,
          body: message,
          createdAt: now,
        },
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: ticket.id });
}
