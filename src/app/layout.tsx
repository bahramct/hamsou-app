import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DevModeBadge } from "@/components/dev/DevModeBadge";
import { DevResetPanel } from "@/components/dev/DevResetPanel";
import { ChatFAB } from "@/components/features/chat/ChatFAB";
import { DisableAutofill } from "@/components/system/DisableAutofill";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { ToastHost } from "@/components/notifications/ToastHost";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import { prisma } from "@/lib/db/client";

export const metadata: Metadata = {
  // پایهٔ resolve لینک‌های مطلق OG/توییتر (هشدار metadataBase در صفحات مقاله)
  metadataBase: new URL(getAppBaseUrl()),
  title: "همسو — برای واقعی‌تر زندگی کردن",
  description: "یک تعهد در روز. یک پرسش آرام فردا. همسو، آینه‌ای برای صادق ماندن با خود.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let companionName: string | null = null;
  let userName: string | null = null;
  let isAuthenticated = false;
  try {
    const session = await getSessionUser();
    if (session) {
      isAuthenticated = true;
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { companionName: true, displayName: true },
      });
      companionName = user?.companionName ?? null;
      userName = user?.displayName ?? null;
    }
  } catch {
    // fallback — layout هرگز throw نمی‌کند
  }

  return (
    <html lang="fa" dir="rtl" className="h-full" suppressHydrationWarning>
      {/* تمِ روشن/تاریک — در <head> قبل از paint روی <html> می‌نشیند (بدون فلش، DECISION-067) */}
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full font-pelak antialiased">
        {/* قانون سراسری: بدون حباب پیشنهاد/autofill در هیچ ورودی (سایت + پنل) */}
        <DisableAutofill />
        {children}
        {/* لایهٔ گذرای toast — روی سایت و پنل (DECISION-046) */}
        <ToastHost />
        <ChatFAB companionName={companionName} userName={userName} isAuthenticated={isAuthenticated} />
        {/* ابزارهای dev — در prod هیچ‌چیز رندر نمی‌شود (CLAUDE.md §۱۳) */}
        <DevModeBadge />
        <DevResetPanel />
      </body>
    </html>
  );
}
