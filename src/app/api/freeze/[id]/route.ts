// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/freeze/[id] — لغو زودهنگام فریز (DECISION-083)
//
// اگر فریز هنوز شروع نشده → حذف کامل
// اگر فریز فعال است (شروع شده) → toDate = دیروز (روزهای گذشته حفظ می‌شوند)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { getTodayDateForDB } from "@/lib/utils/date";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const freeze = await prisma.gapRecord.findFirst({
    where: { id, userId: user.userId, type: "freeze" },
    select: { id: true, fromDate: true, toDate: true },
  });

  if (!freeze) {
    return NextResponse.json({ ok: false, message: "فریز یافت نشد" }, { status: 404 });
  }

  const today = getTodayDateForDB();

  if (freeze.fromDate > today) {
    // هنوز شروع نشده → حذف کامل
    await prisma.gapRecord.delete({ where: { id } });
  } else {
    // فعال است → toDate = دیروز (روزهای گذشته حفظ می‌شوند، امروز آزاد می‌شود)
    const yesterday = new Date(today.getTime() - MS_PER_DAY);
    if (yesterday < freeze.fromDate) {
      // از همان امروز شروع شده بود → حذف کامل
      await prisma.gapRecord.delete({ where: { id } });
    } else {
      await prisma.gapRecord.update({
        where: { id },
        data: { toDate: yesterday },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
