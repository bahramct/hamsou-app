// ─────────────────────────────────────────────────────────────────────────────
// GET /share/[id]/image?format=card|poster — DECISION-054
//
// تصویرِ قابل‌دانلودِ گزارش (next/og · Satori):
//   • card   → ۱۲۰۰×۶۳۰ (پیش‌نمایشِ فشرده)
//   • poster → ۱۰۸۰×۱۸۰۰ (پوسترِ کامل با نمودارها)
//
// زیرِ درختِ عمومیِ /share است (هم‌خانهٔ صفحه و opengraph-image) → بدونِ auth، اما
// گِیت‌شده با `isShared`: گزارشِ خصوصی/ناموجود → کارتِ برندِ عمومی (بدونِ نشتِ داده).
// runtime=nodejs (خواندنِ فونت از دیسک).
// ─────────────────────────────────────────────────────────────────────────────

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { getJalaaliWeekRange } from "@/lib/utils/date";
import type { WeeklyReportContent } from "@/types/weekly-report";
import {
  CompactCard,
  Poster,
  BrandCard,
  loadShareFonts,
  buildShareImageData,
  SHARE_SIZES,
  type ShareFormat,
} from "@/lib/reports/share-image";

export const runtime = "nodejs";

function resolveFormat(value: string | null): ShareFormat {
  return value === "poster" ? "poster" : "card";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = resolveFormat(searchParams.get("format"));
  const size = SHARE_SIZES[format];
  const fonts = loadShareFonts();

  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: { user: { select: { displayName: true } } },
  });

  // گزارشِ خصوصی/ناموجود → کارتِ برند (بدونِ نشت)
  if (!report || !report.isShared) {
    return new ImageResponse(<BrandCard width={size.width} height={size.height} />, {
      ...size,
      fonts,
    });
  }

  const range = getJalaaliWeekRange(report.weekStart);
  const parsed = JSON.parse(report.aiContent) as { content: WeeklyReportContent };
  const data = buildShareImageData(
    parsed.content,
    range.jalaliStart,
    range.jalaliEnd,
    report.user.displayName
  );

  const element = format === "poster" ? <Poster data={data} /> : <CompactCard data={data} />;

  return new ImageResponse(element, {
    ...size,
    fonts,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
