// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/support/tickets/[id] — تغییر وضعیت/اولویت تیکت (DECISION-044)
// enforce: support.respond. اعتبارسنجی با کاتالوگ. closed → closedAt ثبت می‌شود.
// audit: support.status.change / support.priority.change.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { Statuses, Priorities } from "@/lib/support/tickets";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "support.respond")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.supportTicket.findUnique({
    where: { id },
    select: { id: true, status: true, priority: true },
  });
  if (!existing) return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });

  const data: Record<string, unknown> = {};
  const audits: { action: string; meta: Record<string, unknown> }[] = [];

  if (typeof b.status === "string" && b.status !== existing.status) {
    if (!Statuses.is(b.status)) return NextResponse.json({ error: "وضعیت نامعتبر." }, { status: 400 });
    data.status = b.status;
    data.closedAt = b.status === "closed" ? getNow() : null;
    audits.push({ action: "support.status.change", meta: { from: existing.status, to: b.status } });
  }

  if (typeof b.priority === "string" && b.priority !== existing.priority) {
    if (!Priorities.is(b.priority)) return NextResponse.json({ error: "اولویت نامعتبر." }, { status: 400 });
    data.priority = b.priority;
    audits.push({ action: "support.priority.change", meta: { from: existing.priority, to: b.priority } });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await prisma.supportTicket.update({ where: { id }, data });

  for (const a of audits) {
    await logAdminAction({
      actorId: ctx.admin.id,
      action: a.action,
      targetType: "ticket",
      targetId: id,
      meta: a.meta,
    });
  }

  return NextResponse.json({ ok: true });
}
