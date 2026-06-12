// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contact/captcha — صدور چالش کپچای اختصاصی (DECISION-072)
// خروجی: { ok, token, svg } — svg در کلاینت inline رندر می‌شود (رنگ از currentColor).
// stateless: پاسخ در توکن HMAC امضاشده است؛ نیازی به ذخیره در DB نیست.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/captcha/captcha";

export const dynamic = "force-dynamic";

export async function GET() {
  const { token, svg } = createCaptcha();
  return NextResponse.json({ ok: true, token, svg });
}
