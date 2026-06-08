// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/sms/logs — آخرین رکوردهای ارسال پیامک (DECISION-061)
//   GET : enforce sms.read. ۵۰ ارسال آخر (provider/sandbox/وضعیت/messageId/زمان).
//
// این مسیر «اطمینان» را فراهم می‌کند: بعد از ورود کاربر در سایت، رکورد تازه نشان می‌دهد
// از کدام provider (smsir/mock) و آیا sandbox بوده.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";

const PURPOSE_LABELS: Record<string, string> = {
  "otp-login": "ورود به سایت",
  "otp-add-phone": "افزودن موبایل",
  test: "ارسال تستی",
};

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "sms.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const logs = await prisma.smsLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    logs: logs.map((l) => ({
      id: l.id,
      provider: l.provider,
      purpose: l.purpose,
      purposeLabel: PURPOSE_LABELS[l.purpose] ?? l.purpose,
      phoneMasked: l.phoneMasked,
      success: l.success,
      status: l.status,
      messageId: l.messageId,
      error: l.error,
      isSandbox: l.isSandbox,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
