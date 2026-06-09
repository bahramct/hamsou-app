// GET /api/admin/email/logs — آخرین لاگ‌های ارسال ایمیل — enforce email.read

import { NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "email.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const logs = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    logs: logs.map((l) => ({
      id: l.id,
      provider: l.provider,
      purpose: l.purpose,
      emailMasked: l.emailMasked,
      subject: l.subject,
      success: l.success,
      messageId: l.messageId,
      error: l.error,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
