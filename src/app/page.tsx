// صفحهٔ اصلی (Landing) — محتوای سکشن‌ها از CMS (DECISION-066): منتشرشده → fallback کد.
import { CmsPageView } from "@/components/cms/bodies";
import { getPageForSite } from "@/lib/cms/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sections = await getPageForSite("landing");
  return <CmsPageView pageKey="landing" sections={sections} />;
}
