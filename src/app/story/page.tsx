import type { Metadata } from "next";
import { CmsPageView } from "@/components/cms/bodies";
import { getPageForSite } from "@/lib/cms/queries";

export const metadata: Metadata = {
  title: "داستان همسو — چرا این ابزار ساخته شد",
  description:
    "یک شب، یک پرسش، یک آینه. داستانِ شکل‌گیری همسو از یک لحظه‌ی صادقانه آغاز شد.",
};

export const dynamic = "force-dynamic";

export default async function StoryPage() {
  const sections = await getPageForSite("story");
  return <CmsPageView pageKey="story" sections={sections} />;
}
