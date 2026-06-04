import { NextRequest, NextResponse } from "next/server";
import { IS_DEV_MODE } from "@/lib/env";
import { getSessionUser } from "@/lib/utils/auth-server";
import { seedEntriesWithFeedback } from "@/lib/dev/seed";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dev/seed/entries — ثبت تعهدهای گذشته برای کاربر جاری
//
// Body: { days?: number }  (پیش‌فرض ۷، حداکثر ۳۰)
// Response: { ok, created, skipped, entryIds }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });
  }

  let days = 7;
  try {
    const body = await request.json();
    if (typeof body.days === "number") {
      days = Math.max(1, Math.min(30, Math.round(body.days)));
    }
  } catch {
    // بدنه اختیاری است — از مقدار پیش‌فرض استفاده می‌شود
  }

  const result = await seedEntriesWithFeedback(user.userId, days);

  return NextResponse.json({ ok: true, ...result });
}
