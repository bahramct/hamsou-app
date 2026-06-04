// ─────────────────────────────────────────────────────────────────────────────
// POST /api/feedback — ثبت بازخورد برای یک تعهد (TASK-006)
//
// body: { entryId: string, status: "DONE" | "NOT_DONE", note?: string }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { isFeedbackStatus } from "@/constants/feedback";

export async function POST(request: NextRequest) {
  // ۱. احراز هویت
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // ۲. خواندن body
  let body: { entryId?: unknown; status?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const entryId = typeof body.entryId === "string" ? body.entryId.trim() : "";
  const status = body.status;
  const noteRaw = typeof body.note === "string" ? body.note.trim() : "";
  const note = noteRaw.length > 0 ? noteRaw : null;

  // ۳. اعتبارسنجی
  if (!entryId) {
    return NextResponse.json(
      { ok: false, error: "entryId_required" },
      { status: 422 },
    );
  }
  if (!isFeedbackStatus(status)) {
    return NextResponse.json(
      { ok: false, error: "invalid_status", message: "وضعیت باید DONE یا NOT_DONE باشد" },
      { status: 422 },
    );
  }
  if (note && note.length > 300) {
    return NextResponse.json(
      { ok: false, error: "note_too_long", message: "یادداشت حداکثر ۳۰۰ کاراکتر می‌تواند باشد" },
      { status: 422 },
    );
  }

  // ۴. بررسی تعلق تعهد به کاربر و نبود بازخورد قبلی
  const entry = await prisma.dailyEntry.findUnique({
    where: { id: entryId },
    include: { feedback: true },
  });

  if (!entry || entry.userId !== user.userId) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (entry.feedback) {
    return NextResponse.json(
      { ok: false, error: "feedback_already_exists", message: "این تعهد قبلاً بازخورد گرفته" },
      { status: 409 },
    );
  }

  // ۵. ثبت بازخورد
  const feedback = await prisma.entryFeedback.create({
    data: {
      entryId,
      status,
      note,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      feedback: {
        id: feedback.id,
        status: feedback.status,
        note: feedback.note,
      },
    },
    { status: 201 },
  );
}
