// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/users/[id]/notify — ارسال نوتیف مستقیم ادمین به کاربر (DECISION-109)
// enforce: users.write
// body: { title, body?, link? }
// → Notification با type="admin.message"
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/notifications/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "users.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isBanned: true },
  });
  if (!user) return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof b?.title === "string" ? b.title.trim() : "";
  if (!title) return NextResponse.json({ error: "عنوان اعلان اجباری است." }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "عنوان حداکثر ۲۰۰ نویسه." }, { status: 400 });

  const body = typeof b?.body === "string" ? b.body.trim().slice(0, 1000) || null : null;
  const link = typeof b?.link === "string" ? b.link.trim().slice(0, 500) || null : null;

  await createNotification({
    userId: user.id,
    type: "admin.message",
    data: {
      title,
      ...(body ? { body } : {}),
      ...(link ? { link } : {}),
    },
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "notification.send",
    targetType: "user",
    targetId: user.id,
    meta: { title },
  });

  return NextResponse.json({ ok: true });
}
