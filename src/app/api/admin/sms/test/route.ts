// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/sms/test — ارسال تستی پیامک از مسیر سرویسِ فعال (DECISION-061)
//   POST : enforce sms.send. یک کد تصادفی به شمارهٔ داده‌شده می‌فرستد و نتیجه را
//          برمی‌گرداند (provider/sandbox/messageId/error). در SmsLog هم با purpose=test ثبت می‌شود.
//
// هدف: مالک مطمئن شود ارسال واقعاً از مسیر سرویسِ فعال (مثلاً sms.ir sandbox) می‌گذرد.
// کد ارسالی در پاسخ برنمی‌گردد (ارسال واقعی است)؛ اثبات از طریق provider/messageId است.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { sendVerificationSms } from "@/lib/sms/send";
import { generateOtpCode, normalizeIranPhone } from "@/lib/utils/otp";

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "sms.send")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { phone?: unknown } | null;
  const phone = typeof body?.phone === "string" ? normalizeIranPhone(body.phone) : null;
  if (!phone) {
    return NextResponse.json({ error: "شماره موبایل معتبر نیست. فرمت صحیح: ۰۹XXXXXXXXX" }, { status: 400 });
  }

  const code = generateOtpCode();
  const result = await sendVerificationSms(phone, code, "test");

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "sms.test.send",
    targetType: "sms",
    targetId: result.providerId,
    meta: { provider: result.providerId, success: result.success, isSandbox: result.isSandbox },
  });

  return NextResponse.json({
    ok: result.success,
    provider: result.providerId,
    serviceLabel: result.serviceLabel,
    isSandbox: result.isSandbox,
    messageId: result.messageId ?? null,
    status: result.status ?? null,
    error: result.error ?? null,
  });
}
