// ─────────────────────────────────────────────────────────────────────────────
// POST /api/onboarding/complete — پایانِ سفرِ onboarding (DECISION-085)
//
// body: { displayName?, companionName? } — هر دو اختیاری (کاربر می‌تواند رد کند)
// - نام نمایشی و نام همدم را (در صورت ارسال) ذخیره می‌کند
// - onboardedAt را ست می‌کند تا سفر دوباره نمایش داده نشود (حتی اگر کاربر رد کرده باشد)
// اعتبارسنجی هم‌تراز با /api/profile (displayName ≤ ۵۰، companionName ≤ ۳۰).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { displayName?: unknown; companionName?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const data: { displayName?: string | null; companionName?: string | null; onboardedAt: Date } = {
    onboardedAt: getNow(),
  };

  if (body && "displayName" in body) {
    const raw = body.displayName;
    const val = typeof raw === "string" ? raw.trim() : "";
    if (val.length > 50) {
      return NextResponse.json(
        { ok: false, error: "display_name_too_long", message: "نام نمایشی حداکثر ۵۰ کاراکتر" },
        { status: 422 }
      );
    }
    if (val) data.displayName = val;
  }

  if (body && "companionName" in body) {
    const raw = body.companionName;
    const val = typeof raw === "string" ? raw.trim() : "";
    if (val.length > 30) {
      return NextResponse.json(
        { ok: false, error: "companion_name_too_long", message: "نام همدم حداکثر ۳۰ کاراکتر" },
        { status: 422 }
      );
    }
    if (val) data.companionName = val;
  }

  await prisma.user.update({
    where: { id: user.userId },
    data,
  });

  return NextResponse.json({ ok: true });
}
