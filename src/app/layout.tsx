import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "همسو - مسیر همسویی با خودت",
  description: "برنامه‌ریزی و پیگیری تعهدات شخصی برای رسیدن به اهداف",
  keywords: ["همسو", "تعهد", "برنامه‌ریزی", "بازتاب", "اهداف شخصی", "پیشرفت"],
  authors: [{ name: "تیم همسو" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "همسو",
    description: "مسیر همسویی با خودت",
    url: "https://chat.z.ai",
    siteName: "همسو",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "همسو",
    description: "مسیر همسویی با خودت",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
