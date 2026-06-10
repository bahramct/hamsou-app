import type { Metadata } from "next";
import { CmsPageView } from "@/components/cms/bodies";
import { getPageForSite } from "@/lib/cms/queries";

export const metadata: Metadata = {
  title: "حریم خصوصی — همسو",
  description: "همسو متعهد است داده‌های شما را با حداکثر مراقبت و احترام نگه‌داری کند.",
};

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const sections = await getPageForSite("privacy");
  return <CmsPageView pageKey="privacy" sections={sections} />;
}
