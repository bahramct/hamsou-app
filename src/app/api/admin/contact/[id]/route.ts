// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/contact/[id] — مدیریت پیام‌های فرم تماس (DECISION-072)
//   PATCH  : { action: "read" | "unread" | "archive" } — support.read
//   DELETE : حذف دائمی — support.respond
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "support.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const msg = await prisma.contactMessage.findUnique({ where: { id }, select: { id: true } });
  if (!msg) return NextResponse.json({ error: "پیام یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = b?.action;
  if (action !== "read" && action !== "unread" && action !== "archive")
    return NextResponse.json({ error: "اکشن نامعتبر." }, { status: 400 });

  const data =
    action === "read"
      ? { status: "read", readAt: getNow(), readById: ctx.admin.id }
      : action === "unread"
        ? { status: "new", readAt: null, readById: null }
        : { status: "archived" };

  await prisma.contactMessage.update({ where: { id }, data });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: `contact.message.${action}`,
    targetType: "contact-message",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "support.respond")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;
  const msg = await prisma.contactMessage.findUnique({ where: { id }, select: { id: true } });
  if (!msg) return NextResponse.json({ error: "پیام یافت نشد." }, { status: 404 });

  await prisma.contactMessage.delete({ where: { id } });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "contact.message.delete",
    targetType: "contact-message",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
