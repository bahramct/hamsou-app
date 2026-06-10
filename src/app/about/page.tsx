import type { Metadata } from "next";
import { CmsPageView } from "@/components/cms/bodies";
import { getPageForSite } from "@/lib/cms/queries";

export const metadata: Metadata = {
  title: "درباره ما — همسو",
  description: "همسو از یک سوال ساخته شد: چرا فاصله‌ای بین آنچه می‌گوییم و آنچه می‌کنیم هست؟",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const sections = await getPageForSite("about");
  return <CmsPageView pageKey="about" sections={sections} />;
}
