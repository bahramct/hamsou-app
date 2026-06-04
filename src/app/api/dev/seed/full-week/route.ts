import { NextResponse } from "next/server";
import { IS_DEV_MODE } from "@/lib/env";
import { getSessionUser } from "@/lib/utils/auth-server";
import { seedFullWeek } from "@/lib/dev/seed";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dev/seed/full-week — یک هفته کامل: ۷ تعهد + بازخورد
//
// بدون بدنه.
// مناسب برای تست سریع گزارش هفتگی AI بدون seed مرحله‌به‌مرحله.
// Response: { ok, entries: { created, skipped }, feedback: { created, skipped } }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST() {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });
  }

  const result = await seedFullWeek(user.userId);

  return NextResponse.json({ ok: true, ...result });
}
