// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/content/[page] — خواندن/ذخیرهٔ پیش‌نویسِ یک صفحه (DECISION-066)
//   GET : پیش‌نویس (materialize‌شده) + schema انواع + وضعیتِ انتشار — content.read
//   PUT : جایگزینیِ کاملِ پیش‌نویس (ردیف‌های PageSection) — content.write
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { getPageConfig } from "@/lib/cms/pages";
import { getDraftSections, getDefaultSections } from "@/lib/cms/queries";
import { schemasForPage, sanitizeInstances } from "@/lib/cms/admin";

type Ctx = { params: Promise<{ page: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "content.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { page } = await params;
  const cfg = getPageConfig(page);
  if (!cfg || !cfg.enabled) return NextResponse.json({ error: "صفحه یافت نشد یا فعال نیست." }, { status: 404 });

  // پیش‌نویس از DB؛ اگر هرگز ویرایش نشده → نمونه‌های پیش‌فرضِ کد (materialize برای ویرایش)
  const draft = await getDraftSections(page);
  const sections = draft.length > 0 ? draft : getDefaultSections(page);

  const published = await prisma.pageContent.findUnique({ where: { pageKey: page } });

  return NextResponse.json({
    ok: true,
    page: { key: cfg.key, label: cfg.label, path: cfg.path },
    sections,
    schemas: schemasForPage(page),
    hasDraft: draft.length > 0,
    published: published
      ? { at: published.publishedAt, isStale: published.publishedJson !== JSON.stringify(sections.map((s) => ({ type: s.type, isVisible: s.isVisible, content: s.content }))) }
      : null,
  });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "content.write")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const { page } = await params;
  const cfg = getPageConfig(page);
  if (!cfg || !cfg.enabled) return NextResponse.json({ error: "صفحه یافت نشد یا فعال نیست." }, { status: 404 });

  const b = (await req.json().catch(() => null)) as { sections?: unknown } | null;
  const sections = sanitizeInstances(b?.sections);

  // جایگزینیِ اتمیک: حذفِ ردیف‌های قبلی + درجِ مجدد با order=index
  await prisma.$transaction(async (tx) => {
    await tx.pageSection.deleteMany({ where: { pageKey: page } });
    if (sections.length > 0) {
      await tx.pageSection.createMany({
        data: sections.map((s, i) => ({
          pageKey: page,
          type: s.type,
          order: i,
          isVisible: s.isVisible,
          content: JSON.stringify(s.content),
        })),
      });
    }
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "content.draft.save",
    targetType: "page",
    targetId: page,
    meta: { count: sections.length },
  });

  return NextResponse.json({ ok: true });
}
