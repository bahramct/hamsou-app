// ─────────────────────────────────────────────────────────────────────────────
// /share/[id] — صفحهٔ عمومیِ اشتراک‌گذاری گزارش هفتگی (DECISION-052)
//
// Server Component — بدون auth. اگر isShared=false یا report پیدا نشد → 404.
// هیچ اطلاعات خصوصی‌ای (شماره، plan، token) در صفحه نیست.
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { AmbientField } from "@/components/layout/AmbientField";
import { SharedReportView } from "@/components/features/reports/SharedReportView";
import { getJalaaliWeekRange } from "@/lib/utils/date";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import type { SerializedWeeklyReport, WeeklyReportContent } from "@/types/weekly-report";

interface Props {
  params: Promise<{ id: string }>;
}

// ── metadata برای OG / tab title ──────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const metadataBase = new URL(getAppBaseUrl());

  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: { user: { select: { displayName: true } } },
  });
  if (!report?.isShared) return { title: "همسو", metadataBase };

  const range = getJalaaliWeekRange(report.weekStart);
  const title = "گزارش هفتگی — همسو";
  const description = `یک هفته از مسیر — ${range.jalaliStart} تا ${range.jalaliEnd}`;

  return {
    metadataBase,
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "همسو",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ── صفحه ─────────────────────────────────────────────────────────────────────

export default async function SharePage({ params }: Props) {
  const { id } = await params;

  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: { user: { select: { displayName: true } } },
  });

  if (!report || !report.isShared) notFound();

  const range = getJalaaliWeekRange(report.weekStart);
  const parsed = JSON.parse(report.aiContent) as {
    content: WeeklyReportContent;
    meta: SerializedWeeklyReport["meta"];
  };

  const serialized: SerializedWeeklyReport = {
    id: report.id,
    weekStart: report.weekStart.toISOString(),
    weekEnd: report.weekEnd.toISOString(),
    jalaliStart: range.jalaliStart,
    jalaliEnd: range.jalaliEnd,
    generatedAt: report.generatedAt.toISOString(),
    content: parsed.content,
    meta: parsed.meta,
    isShared: true,
  };

  return (
    <main className="relative min-h-dvh">
      <AmbientField />

      <div className="relative z-10 max-w-xl mx-auto w-full px-5 py-8 sm:py-12">
        {/* برند‌بار بالا */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 opacity-55 hover:opacity-90 transition-opacity duration-300"
          >
            <Image src="/logo.png" alt="همسو" width={22} height={22} />
            <span className="text-sm text-stone font-medium">همسو</span>
          </Link>
          <span className="text-[10px] text-fog tracking-widest uppercase">
            گزارش هفتگی
          </span>
        </div>

        {/* محتوای گزارش */}
        <SharedReportView
          report={serialized}
          displayName={report.user.displayName}
        />

        {/* فوتر */}
        <footer className="mt-8 pt-6 border-t border-black/6 text-center">
          <Link
            href="/"
            className="text-xs text-fog hover:text-stone transition-colors duration-200"
          >
            ساخته‌شده با همسو
          </Link>
        </footer>
      </div>
    </main>
  );
}
