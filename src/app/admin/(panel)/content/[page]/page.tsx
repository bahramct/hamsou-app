// ─────────────────────────────────────────────────────────────────────────────
// /admin/content/[page] — ویرایشگرِ سکشن‌های یک صفحه (DECISION-066)
// enforce: content.read؛ ذخیره/انتشار: content.write
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { getPageConfig } from "@/lib/cms/pages";
import { getDraftSections, getDefaultSections } from "@/lib/cms/queries";
import { schemasForPage } from "@/lib/cms/admin";
import { ContentEditor } from "@/components/admin/content/ContentEditor";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ page: string }>;
}

export default async function ContentEditPage({ params }: Props) {
  const ctx = await requirePermission("content.read");
  const canWrite = can(ctx, "content.write");
  const { page } = await params;

  const cfg = getPageConfig(page);
  if (!cfg || !cfg.enabled) notFound();

  const draft = await getDraftSections(page);
  const sections = draft.length > 0 ? draft : getDefaultSections(page);
  const schemas = schemasForPage(page);
  const published = await prisma.pageContent.findUnique({
    where: { pageKey: page },
    select: { publishedAt: true },
  });

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-fog mb-5">
        <Link href="/admin/content" className="hover:text-ink transition-colors">محتوای صفحات</Link>
        <span style={{ opacity: 0.5 }}>›</span>
        <span className="text-stone">{cfg.label}</span>
      </div>

      <ContentEditor
        pageKey={page}
        pageLabel={cfg.label}
        pagePath={cfg.path}
        initialSections={sections}
        schemas={schemas}
        canWrite={canWrite}
        hasPublished={Boolean(published)}
      />
    </div>
  );
}
