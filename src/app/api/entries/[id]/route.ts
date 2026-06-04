// ─────────────────────────────────────────────────────────────────────────────
// /api/entries/[id]
//
// PATCH — ویرایش محتوای تعهد (فقط در بازه ۲ ساعته پس از ثبت)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { canEdit } from "@/lib/utils/date";
import { getNow } from "@/lib/dev/time";
import type { SerializedEntry } from "@/types/entry";

type RouteParams = { id: string };

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // بررسی وجود تعهد
  const entry = await prisma.dailyEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  // بررسی مالکیت
  if (entry.userId !== user.userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // بررسی پنجره ویرایش
  const stillEditable = !entry.isLocked && canEdit(entry.editableUntil);
  if (!stillEditable) {
    // اگر isLocked هنوز false بود → به‌روزرسانی می‌کنیم (تنبل)
    if (!entry.isLocked) {
      await prisma.dailyEntry.update({ where: { id }, data: { isLocked: true } });
    }
    return NextResponse.json(
      { ok: false, error: "entry_locked", message: "بازه ویرایش تموم شده — تعهد قفل شد" },
      { status: 423 }, // 423 Locked
    );
  }

  // خواندن body
  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";

  // اعتبارسنجی
  if (content.length < 5) {
    return NextResponse.json(
      { ok: false, error: "content_too_short", message: "تعهدت رو بیشتر توضیح بده (حداقل ۵ کاراکتر)" },
      { status: 422 },
    );
  }
  if (content.length > 500) {
    return NextResponse.json(
      { ok: false, error: "content_too_long", message: "تعهد حداکثر ۵۰۰ کاراکتر می‌تواند باشد" },
      { status: 422 },
    );
  }

  // ذخیره ویرایش
  const updated = await prisma.dailyEntry.update({
    where: { id },
    data: { content, editedAt: getNow() },
  });

  const serialized: SerializedEntry = {
    id: updated.id,
    content: updated.content,
    createdAt: updated.createdAt.toISOString(),
    editableUntil: updated.editableUntil.toISOString(),
    isLocked: updated.isLocked,
    canEdit: !updated.isLocked && canEdit(updated.editableUntil),
    wasEdited: updated.editedAt !== null,
  };

  return NextResponse.json({ ok: true, entry: serialized });
}
