// POST /api/reports/weekly/[id]/share — toggle وضعیت isShared گزارش
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: { shared?: boolean } = {};
  try {
    body = (await request.json()) as { shared?: boolean };
  } catch {
    // body اختیاری — default: true
  }
  const shared = body.shared ?? true;

  const report = await prisma.weeklyReport.findUnique({ where: { id } });
  if (!report || report.userId !== user.userId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.weeklyReport.update({
    where: { id },
    data: { isShared: shared },
  });

  return NextResponse.json({ ok: true, isShared: updated.isShared });
}
