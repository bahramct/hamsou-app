// ─────────────────────────────────────────────────────────────────────────────
// POST /api/onboarding/complete — پایانِ سفرِ onboarding (DECISION-085/088/089)
//
// body: { displayName?, motive? } — هر دو اختیاری (کاربر می‌تواند رد کند)
// - نام نمایشی و انگیزهٔ ورود را (در صورت ارسال) ذخیره می‌کند
// - onboardedAt را ست می‌کند تا سفر دوباره نمایش داده نشود (حتی اگر کاربر رد کرده باشد)
// نکته: نامِ همدم دیگر اینجا (و هیچ‌جای کاربر) قابلِ تنظیم نیست — admin-controlled (DECISION-089).
// اعتبارسنجی هم‌تراز با /api/profile (displayName ≤ ۵۰).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { isValidMotive, slugsToMotive } from "@/lib/onboarding/motives";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { displayName?: unknown; motive?: unknown; motives?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const data: {
    displayName?: string | null;
    onboardingMotive?: string | null;
    onboardedAt: Date;
  } = {
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

  // انگیزهٔ ورود — پشتیبانی از آرایه (چندگزینه‌ای) یا رشتهٔ تکی
  // body.motives: string[] (جدید) | body.motive: string (قدیم — backward-compat)
  const rawMotives = body && "motives" in body ? body.motives : (body && "motive" in body ? body.motive : undefined);
  if (rawMotives !== undefined) {
    let slugs: string[] = [];
    if (Array.isArray(rawMotives)) {
      slugs = rawMotives.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean);
    } else if (typeof rawMotives === "string") {
      slugs = rawMotives.split(",").map((s) => s.trim()).filter(Boolean);
    }
    const joined = slugsToMotive(slugs);
    if (joined && isValidMotive(joined)) data.onboardingMotive = joined;
  }

  await prisma.user.update({
    where: { id: user.userId },
    data,
  });

  return NextResponse.json({ ok: true });
}
