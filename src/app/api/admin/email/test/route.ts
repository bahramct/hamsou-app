// POST /api/admin/email/test — ارسال ایمیل تستی — enforce email.send

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { getDefaultEmailService } from "@/lib/email/services";
import { getEmailAdapterForService } from "@/lib/adapters";
import { prisma } from "@/lib/db/client";
import { maskEmail } from "@/lib/email/send";

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "email.send")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { to?: unknown } | null;
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "آدرس ایمیل گیرنده معتبر نیست." }, { status: 400 });
  }

  const svc = await getDefaultEmailService();
  if (!svc) {
    return NextResponse.json({ error: "هیچ سرویس ایمیل فعالی تنظیم نشده است." }, { status: 400 });
  }

  let result: { success: boolean; messageId?: string; error?: string };
  try {
    const adapter = getEmailAdapterForService(svc);
    result = await adapter.sendVerificationCode(to, "123456");
  } catch (err) {
    result = { success: false, error: err instanceof Error ? err.message : String(err) };
  }

  // ثبت لاگ
  try {
    await prisma.emailLog.create({
      data: {
        provider: svc.provider,
        serviceId: svc.id,
        purpose: "test",
        emailMasked: maskEmail(to),
        subject: "ایمیل آزمایشی — همسو",
        success: result.success,
        messageId: result.messageId ?? null,
        error: result.error ?? null,
      },
    });
  } catch (e) {
    console.error("[email/test] ثبت لاگ ناموفق:", e);
  }

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "email.test.send",
    targetType: "email-service",
    targetId: svc.id,
    meta: { to: maskEmail(to), success: result.success },
  });

  if (!result.success) {
    return NextResponse.json({ error: `ارسال ناموفق: ${result.error}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, messageId: result.messageId });
}
