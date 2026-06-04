// ─────────────────────────────────────────────────────────────────────────────
// /api/dev/ai/invocations — لاگ فراخوانی‌های AI
// فقط dev — DevAIInspector این را می‌خواند
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { IS_DEV_MODE } from "@/lib/env";
import { recentInvocations, clearInvocations } from "@/lib/ai/observability";
import { aiRegistry } from "@/lib/ai/registry";
import { ensureRolesRegistered } from "@/lib/ai/bootstrap";

export async function GET() {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  ensureRolesRegistered();

  return NextResponse.json({
    ok: true,
    invocations: recentInvocations(),
    roles: aiRegistry.list(),
  });
}

export async function DELETE() {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  clearInvocations();
  return NextResponse.json({ ok: true });
}
