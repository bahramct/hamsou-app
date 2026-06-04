// POST /api/dev/seed/gap-scenario — seed سناریوی فاصله غیرفعالی (TASK-007)
import { NextRequest, NextResponse } from "next/server";
import { IS_DEV_MODE } from "@/lib/env";
import { getSessionUser } from "@/lib/utils/auth-server";
import { seedGapScenario } from "@/lib/dev/seed";

export async function POST(request: NextRequest) {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let historyDays = 5;
  let gapDays = 3;
  try {
    const body = (await request.json()) as { historyDays?: unknown; gapDays?: unknown };
    if (typeof body.historyDays === "number") historyDays = Math.max(1, Math.min(14, body.historyDays));
    if (typeof body.gapDays === "number") gapDays = Math.max(2, Math.min(14, body.gapDays));
  } catch { /* body اختیاری */ }

  const result = await seedGapScenario(user.userId, historyDays, gapDays);

  return NextResponse.json({ ok: true, ...result });
}
