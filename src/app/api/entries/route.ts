// ─────────────────────────────────────────────────────────────────────────────
// /api/entries
//
// GET  ?today=1  — تعهد امروز کاربر جاری (بر اساس تاریخ شمسی ایران)
// POST           — ثبت تعهد جدید (یک تعهد در روز)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getTodayDateForDB, canEdit } from "@/lib/utils/date";
import { getNow } from "@/lib/dev/time";
import type { SerializedEntry } from "@/types/entry";

/** بازه ویرایش — از env یا پیش‌فرض ۲ ساعت */
function editWindowMs(): number {
  return parseInt(process.env.ENTRY_EDIT_WINDOW_HOURS ?? "2", 10) * 60 * 60 * 1000;
}

function serializeEntry(entry: {
  id: string;
  content: string;
  createdAt: Date;
  editableUntil: Date;
  isLocked: boolean;
  editedAt: Date | null;
}): SerializedEntry {
  return {
    id: entry.id,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
    editableUntil: entry.editableUntil.toISOString(),
    isLocked: entry.isLocked,
    canEdit: !entry.isLocked && canEdit(entry.editableUntil),
    wasEdited: entry.editedAt !== null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/entries?today=1
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("today") !== "1") {
    return NextResponse.json({ ok: false, error: "use ?today=1" }, { status: 400 });
  }

  const today = getTodayDateForDB();

  const entry = await prisma.dailyEntry.findUnique({
    where: { userId_date: { userId: user.userId, date: today } },
  });

  return NextResponse.json({
    ok: true,
    entry: entry ? serializeEntry(entry) : null,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/entries
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // خواندن body
  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";

  // اعتبارسنجی محتوا
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

  const today = getTodayDateForDB();

  // بررسی تعهد قبلی همین روز
  const existing = await prisma.dailyEntry.findUnique({
    where: { userId_date: { userId: user.userId, date: today } },
  });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "already_exists_today", message: "برای امروز قبلاً تعهد ثبت کردی" },
      { status: 409 },
    );
  }

  // قانون: بدون بازخورد تعهد قبلی، تعهد جدید ممنوع
  const pendingFeedback = await prisma.dailyEntry.findFirst({
    where: { userId: user.userId, date: { lt: today }, feedback: null },
    select: { id: true },
  });
  if (pendingFeedback) {
    return NextResponse.json(
      { ok: false, error: "feedback_required", message: "پیش از ثبت تعهد جدید، بازخورد تعهد قبلی را ثبت کن" },
      { status: 422 },
    );
  }

  // ساخت تعهد جدید — getNow برای time-travel در dev (DECISION-021)
  const now = getNow();
  const editableUntil = new Date(now.getTime() + editWindowMs());

  const entry = await prisma.dailyEntry.create({
    data: {
      userId: user.userId,
      content,
      date: today,
      editableUntil,
    },
  });

  return NextResponse.json(
    { ok: true, entry: serializeEntry(entry) },
    { status: 201 },
  );
}
