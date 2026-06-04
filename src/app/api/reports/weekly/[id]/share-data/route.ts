// GET /api/reports/weekly/[id]/share-data — داده‌های ShareImageData برای رندر client-side
// auth-gated: فقط مالک گزارش می‌تواند دریافت کند.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getJalaaliWeekRange } from "@/lib/utils/date";
import type { WeeklyReportContent } from "@/types/weekly-report";
import { buildShareImageData } from "@/lib/reports/share-image";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: { user: { select: { displayName: true } } },
  });

  if (!report || report.userId !== user.userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const range = getJalaaliWeekRange(report.weekStart);
  const parsed = JSON.parse(report.aiContent) as { content: WeeklyReportContent };
  const data = buildShareImageData(
    parsed.content,
    range.jalaliStart,
    range.jalaliEnd,
    report.user.displayName
  );

  return NextResponse.json(data);
}
