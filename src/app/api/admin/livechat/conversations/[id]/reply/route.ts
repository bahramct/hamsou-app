// POST /api/admin/livechat/conversations/[id]/reply — پاسخ پشتیبان (DECISION-049)
// enforce: support.respond. پیام را با authorAdminId ثبت می‌کند و حضور را تازه می‌کند.
// طبق خواستهٔ مالک: بدون نوتیفیکیشن — badge روی آیکون چت کاربر کافی است.

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { getNow } from "@/lib/dev/time";
import { prisma } from "@/lib/db/client";
import { touchAdminPresence } from "@/lib/support/presence";
import { SUPPORT_CHAT_LIMITS } from "@/lib/support/chat";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!can(ctx, "support.respond")) {
    return NextResponse.json({ ok: false, message: "دسترسی پاسخ نداری." }, { status: 403 });
  }

  const { id } = await params;

  let body: string;
  try {
    const json = await request.json();
    if (typeof json?.content !== "string" || !json.content.trim()) {
      return NextResponse.json({ ok: false, message: "پیام خالی است" }, { status: 400 });
    }
    body = json.content.trim().slice(0, SUPPORT_CHAT_LIMITS.messageMax);
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }

  const session = await prisma.supportChatSession.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!session) {
    return NextResponse.json({ ok: false, message: "گفتگو یافت نشد" }, { status: 404 });
  }

  const now = getNow();
  const msg = await prisma.supportChatMessage.create({
    data: { sessionId: id, authorType: "admin", authorAdminId: ctx.admin.id, body },
  });
  await prisma.supportChatSession.update({
    where: { id },
    data: { lastAdminAt: now },
  });
  await touchAdminPresence(ctx.admin.id);

  return NextResponse.json({
    ok: true,
    message: {
      id: msg.id,
      authorType: "admin" as const,
      authorName: ctx.admin.displayName,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
