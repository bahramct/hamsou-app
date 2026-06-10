// ─────────────────────────────────────────────────────────────────────────────
// /admin/content-preview/[page] — پیش‌نمایشِ تمام‌صفحهٔ پیش‌نویس (DECISION-066)
// بیرونِ گروهِ (panel) → بدونِ AdminShell، دقیقاً مثلِ سایت. زیرِ /admin → محافظتِ
// adminMiddleware (نیازمندِ session ادمین) + گاردِ content.read در خودِ صفحه.
// از getPageForPreview (پیش‌نویس → fallback) می‌خواند، نه نسخهٔ منتشرشده.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin/auth-server";
import { getPageConfig } from "@/lib/cms/pages";
import { getPageForPreview } from "@/lib/cms/queries";
import { CmsPageView } from "@/components/cms/bodies";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ page: string }>;
}

export default async function ContentPreviewPage({ params }: Props) {
  await requirePermission("content.read");
  const { page } = await params;
  const cfg = getPageConfig(page);
  if (!cfg || !cfg.enabled) notFound();

  const sections = await getPageForPreview(page);

  return (
    <>
      {/* نوارِ پیش‌نمایش — فقط در پنل، روی سایتِ زنده نیست */}
      <div
        className="fixed top-0 inset-x-0 z-[100] flex items-center justify-between px-4 py-2 text-xs"
        style={{ background: "var(--color-gold)", color: "var(--color-ink)" }}
      >
        <span style={{ fontWeight: 600 }}>حالتِ پیش‌نمایش — نسخهٔ پیش‌نویس، هنوز منتشر نشده.</span>
        <Link href={`/admin/content/${page}`} className="underline hover:no-underline">بازگشت به ویرایش</Link>
      </div>

      <CmsPageView pageKey={page} sections={sections} />
    </>
  );
}
