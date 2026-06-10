// ─────────────────────────────────────────────────────────────────────────────
// /admin/content — فهرستِ صفحاتِ تحتِ کنترلِ CMS (DECISION-066)
// enforce: content.read؛ ویرایش/انتشار: content.write
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { enabledPages } from "@/lib/cms/pages";
import { formatJalali } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requirePermission("content.read");

  const pages = enabledPages();
  const published = await prisma.pageContent.findMany({
    where: { pageKey: { in: pages.map((p) => p.key) } },
    select: { pageKey: true, publishedAt: true },
  });
  const pubByKey = new Map(published.map((p) => [p.pageKey, p.publishedAt]));

  const draftCounts = await prisma.pageSection.groupBy({
    by: ["pageKey"],
    where: { pageKey: { in: pages.map((p) => p.key) } },
    _count: { _all: true },
  });
  const draftByKey = new Map(draftCounts.map((d) => [d.pageKey, d._count._all]));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">محتوای صفحات</h1>
        <p className="text-sm text-fog mt-0.5">سکشن‌های صفحاتِ سایت را ویرایش، مرتب و منتشر کن.</p>
      </div>

      <div className="rounded-xl bg-mist/15 border border-mist/30 px-4 py-3 text-[12px] leading-relaxed text-charcoal mb-5">
        <div className="font-semibold text-ink mb-1">چطور کار می‌کند؟</div>
        <ul className="list-disc pr-4 space-y-1">
          <li>هر صفحه از چند <b>سکشن</b> ساخته شده. می‌توانی متن‌ها و اندازهٔ فونت را ویرایش کنی، سکشن‌ها را جابه‌جا/مخفی کنی، یا سکشنِ تازه اضافه/حذف کنی.</li>
          <li>تغییرات به‌صورتِ <b>پیش‌نویس</b> ذخیره می‌شوند. تا وقتی <b>«انتشار»</b> نزنی، روی سایتِ زنده اثری ندارند.</li>
          <li>هر زمان می‌توانی به <b>طراحیِ اصلی</b> بازگردانی.</li>
        </ul>
      </div>

      <div className="space-y-2">
        {pages.map((p) => {
          const pubAt = pubByKey.get(p.key);
          const drafts = draftByKey.get(p.key) ?? 0;
          return (
            <Link
              key={p.key}
              href={`/admin/content/${p.key}`}
              className="block rounded-2xl border border-black/8 bg-white/40 p-4 hover:bg-white/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{p.label}</span>
                    <span className="text-[11px] text-fog" dir="ltr">{p.path}</span>
                  </div>
                  <div className="text-[11px] text-fog mt-1 fa-num">
                    {pubAt ? `آخرین انتشار: ${formatJalali(pubAt)}` : "هنوز منتشر نشده (طراحیِ پیش‌فرض روی سایت است)"}
                    {drafts > 0 && " · پیش‌نویسِ ذخیره‌شده دارد"}
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-fog)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
