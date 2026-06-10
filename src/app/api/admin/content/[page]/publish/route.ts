// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/content/[page]/publish — انتشارِ پیش‌نویس روی سایتِ زنده (DECISION-066)
// عکسِ فعلیِ پیش‌نویس (PageSection) → PageContent.publishedJson. content.write لازم است.
// اگر پیش‌نویسی نباشد، پیش‌فرضِ کد منتشر می‌شود (بی‌اثر — مثلِ fallback).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { getPageConfig } from "@/lib/cms/pages";
import { getDraftSections, getDefaultSections } from "@/lib/cms/queries";
import { serializeForPublish } from "@/lib/cms/admin";

type Ctx = { params: Promise<{ page: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "content.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { page } = await params;
  const cfg = getPageConfig(page);
  if (!cfg || !cfg.enabled) return NextResponse.json({ error: "صفحه یافت نشد یا فعال نیست." }, { status: 404 });

  const draft = await getDraftSections(page);
  const sections = draft.length > 0 ? draft : getDefaultSections(page);
  const json = serializeForPublish(sections);

  await prisma.pageContent.upsert({
    where: { pageKey: page },
    update: { publishedJson: json, publishedAt: getNow(), publishedById: ctx.admin.id },
    create: { pageKey: page, publishedJson: json, publishedAt: getNow(), publishedById: ctx.admin.id },
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "content.publish",
    targetType: "page",
    targetId: page,
    meta: { count: sections.length },
  });

  return NextResponse.json({ ok: true });
}
