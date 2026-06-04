// POST /api/admin/roles — ساخت نقش جدید (enforce: roles.manage) — DECISION-036
// نقش جدید بدون migration فقط با داده ساخته می‌شود (ماژولار بودن RBAC).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";

const KEY_RE = /^[a-z][a-z0-9_-]{1,31}$/;

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "roles.manage")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key.trim().toLowerCase() : "";
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const description =
    typeof body?.description === "string" && body.description.trim() ? body.description.trim() : null;

  if (!KEY_RE.test(key)) {
    return NextResponse.json(
      { error: "کلید نقش باید با حرف کوچک لاتین شروع شود و فقط شامل حروف کوچک، عدد، خط تیره و زیرخط باشد." },
      { status: 400 }
    );
  }
  if (!label) return NextResponse.json({ error: "نام نقش الزامی است." }, { status: 400 });

  const exists = await prisma.adminRole.findUnique({ where: { key }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "نقشی با این کلید قبلاً وجود دارد." }, { status: 409 });

  const role = await prisma.adminRole.create({
    data: { key, label, description, isSystem: false },
    select: { id: true, key: true },
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "role.create",
    targetType: "role",
    targetId: role.id,
    meta: { key, label },
  });

  return NextResponse.json({ ok: true, id: role.id, key: role.key });
}
