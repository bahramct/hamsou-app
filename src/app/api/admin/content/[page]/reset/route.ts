// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/content/[page]/reset — بازگرداندنِ پیش‌نویس به پیش‌فرضِ کد (DECISION-066)
// ردیف‌های PageSection حذف می‌شوند → پیش‌نویس دوباره = طراحیِ اصلیِ کد.
// نسخهٔ منتشرشده دست‌نخورده می‌ماند (تا انتشارِ بعدی). content.write لازم است.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { getPageConfig } from "@/lib/cms/pages";

type Ctx = { params: Promise<{ page: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "content.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { page } = await params;
  const cfg = getPageConfig(page);
  if (!cfg || !cfg.enabled) return NextResponse.json({ error: "صفحه یافت نشد یا فعال نیست." }, { status: 404 });

  await prisma.pageSection.deleteMany({ where: { pageKey: page } });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "content.draft.reset",
    targetType: "page",
    targetId: page,
  });

  return NextResponse.json({ ok: true });
}
