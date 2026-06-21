// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/broadcast/notify — اطلاعیه همگانی (DECISION-109)
// فقط owner (super-admin) — enforce isOwner()
// body: { title, body?, link?, segment: "all"|"FREE"|"PLUS"|"PRO" }
// → Notification با type="admin.message" برای همهٔ کاربران یا یک بخش
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { createNotification } from "@/lib/notifications/server";

const VALID_SEGMENTS = ["all", "FREE", "PLUS", "PRO"] as const;
type Segment = typeof VALID_SEGMENTS[number];

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "notification.broadcast")) return NextResponse.json({ error: "دسترسی ارسال اعلان عمومی را نداری." }, { status: 403 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof b?.title === "string" ? b.title.trim() : "";
  if (!title) return NextResponse.json({ error: "عنوان اعلان اجباری است." }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "عنوان حداکثر ۲۰۰ نویسه." }, { status: 400 });

  const body = typeof b?.body === "string" ? b.body.trim().slice(0, 1000) || null : null;
  const link = typeof b?.link === "string" ? b.link.trim().slice(0, 500) || null : null;
  const segment: Segment = VALID_SEGMENTS.includes(b?.segment as Segment)
    ? (b!.segment as Segment)
    : "all";

  // فقط کاربران غیر-banned
  const users = await prisma.user.findMany({
    where: {
      isBanned: false,
      ...(segment !== "all" ? { plan: segment } : {}),
    },
    select: { id: true },
  });

  if (users.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // ارسال دسته‌ای — برای جلوگیری از قفل‌شدن DB روی SQLite
  const BATCH = 50;
  let sent = 0;
  const data = {
    title,
    ...(body ? { body } : {}),
    ...(link ? { link } : {}),
  };
  for (let i = 0; i < users.length; i += BATCH) {
    const slice = users.slice(i, i + BATCH);
    await Promise.all(
      slice.map((u) =>
        createNotification({ userId: u.id, type: "admin.message", data })
      )
    );
    sent += slice.length;
  }

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "notification.broadcast",
    targetType: "system",
    targetId: "broadcast",
    meta: { title, segment, sent },
  });

  return NextResponse.json({ ok: true, sent });
}
