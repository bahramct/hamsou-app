// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/contact/[id]/reply — پاسخِ ادمین به پیامِ «تماس با ما» (DECISION-079)
// پاسخ با ایمیل به فرستنده ارسال می‌شود (فرستنده = سرویسِ ایمیلِ پیش‌فرض، hello@hamsouapp.ir).
// پس از ارسالِ موفق، پیام به وضعیتِ «خوانده‌شده» می‌رود. permission: support.respond.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { sendContactReplyEmail } from "@/lib/email/send";

type Ctx = { params: Promise<{ id: string }> };

const SUBJECT_MAX = 160;
const BODY_MAX = 5000;

export async function POST(req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "support.respond"))
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const msg = await prisma.contactMessage.findUnique({
    where: { id },
    select: { id: true, email: true, subject: true, status: true },
  });
  if (!msg) return NextResponse.json({ error: "پیام یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const subjectRaw = typeof b?.subject === "string" ? b.subject.trim() : "";
  const body = typeof b?.body === "string" ? b.body.trim() : "";

  if (!body || body.length > BODY_MAX)
    return NextResponse.json({ error: "متنِ پاسخ را درست وارد کن." }, { status: 400 });
  if (subjectRaw.length > SUBJECT_MAX)
    return NextResponse.json({ error: "موضوع طولانی است." }, { status: 400 });

  const subject =
    subjectRaw || (msg.subject ? `پاسخ همسو — ${msg.subject}` : "پاسخ همسو");

  const result = await sendContactReplyEmail(msg.email, subject, body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "ارسالِ ایمیل انجام نشد. سرویسِ ایمیل را در پنل بررسی کن." },
      { status: 502 }
    );
  }

  // پس از ارسالِ موفق → خوانده‌شده (مگر بایگانی که دست‌نخورده می‌ماند)
  if (msg.status === "new") {
    await prisma.contactMessage.update({
      where: { id },
      data: { status: "read", readAt: getNow(), readById: ctx.admin.id },
    });
  }

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "contact.message.reply",
    targetType: "contact-message",
    targetId: id,
  });

  return NextResponse.json({ ok: true, provider: result.providerId });
}
