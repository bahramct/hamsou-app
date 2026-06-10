import type { Metadata } from "next";
import { CmsPageView } from "@/components/cms/bodies";
import { getPageForSite } from "@/lib/cms/queries";

export const metadata: Metadata = {
  title: "تماس با ما — همسو",
  description: "سوالی داری؟ آرام بپرس. ما از شنیدن از تو خوشحال می‌شویم.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const sections = await getPageForSite("contact");
  return <CmsPageView pageKey="contact" sections={sections} />;
}
